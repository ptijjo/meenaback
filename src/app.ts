import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
const morgan = require('morgan');
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import http from 'http';
import { Routes } from './interfaces/routes.interface';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS, SESSION_SECRET, SECRET_KEY } from './config';
import { ErrorMiddleware } from './middlewares/error.middleware';
import { logger, stream } from './utils/logger';
import session from 'express-session';
import passport from 'passport';
import './middlewares/oauth.middleware';
import { createClient, RedisClientType } from 'redis';
import path from 'path';
import { socketAuthMiddleware } from './middlewares/socketAuth.middleware';
import { createAdapter } from '@socket.io/redis-adapter';
import { setIo } from './utils/socket/socket';

type MorganFormat = 'dev' | 'combined';
const LOG_FORMAT_MORGAN: MorganFormat = (LOG_FORMAT as MorganFormat) || 'dev';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
  public redisClient: RedisClientType;
  public subRedisClient: RedisClientType;
  public io: any;
  public ioadapter: any;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 8585;
    this.server = http.createServer(this.app);
    this.redisClient = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@localhost:6379`,
    });
    this.subRedisClient = this.redisClient.duplicate();

    Promise.all([this.redisClient.connect(), this.subRedisClient.connect()]).then(() => {
      this.io.adapter(createAdapter(this.redisClient, this.subRedisClient));
    });

    this.redisClient.on('error', err => console.error('❌ Redis Client Error', err));
    this.subRedisClient.on('error', err => console.error('❌ SubRedis Client Error', err));
    this.io = require('socket.io')(this.server, {
      cors: {
        origin: ORIGIN,
        credentials: CREDENTIALS,
      },
    });

    setIo(this.io);

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
    async () => await this.redisConnect();
    async () => await this.initializeSocketAdapter();
    this.initializeSocket();
  }

  public listen() {
    this.server.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.set('trust proxy', 1);
    this.app.use('/public', express.static(path.join(__dirname, '..', 'public')));
    this.app.use(morgan(LOG_FORMAT_MORGAN, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Credentials', 'true'); // Souvent requis par certains navigateurs
      res.header('Access-Control-Allow-Origin', ORIGIN); // Répétition de l'origine
      // Si la redirection posait problème, vous pouvez essayer d'exposer les headers
      // res.header('Access-Control-Expose-Headers', 'Set-Cookie'); // Parfois utile
      next();
    });

    // Session
    this.app.use(
      session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: false,
          sameSite: 'lax',
          //httpOnly: true,
          //maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
        },
      }),
    );

    // Passport
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use(route.path, route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '1.0.0',
          description: 'Example docs',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }

  public async initRedis() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
      console.log('✅ Redis connecté avec succès !');
    }
  }

  private async redisConnect() {
    try {
      await this.initRedis();
    } catch (error) {
      console.error('❌ Erreur lors de la connexion Redis:', error);
    }
  }

  private async initializeSocketAdapter() {
    try {
      // Assurez-vous que le client principal est connecté
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }

      // Cloner le client principal pour créer le client de souscription (Sub)
      const subClient = this.redisClient.duplicate();

      // L'adaptateur prend un client Pub et un client Sub
      this.io.adapter(createAdapter(this.redisClient as any, subClient as any));

      console.log('✅ Socket.IO Adapter Redis configuré pour la scalabilité !');
    } catch (error) {
      console.error("❌ Erreur lors de la configuration de l'adaptateur Redis :", error);
    }
  }

  private initializeSocket() {
    // Middleware d'authentification Socket.IO
    this.io.use((socket, next) => {
      socketAuthMiddleware(socket, err => {
        if (err) {
          console.error(`⚠️ Auth échouée pour socket ${socket.id}: ${err.message}`);
          return next(err);
        }
        next();
      });
    });

    // Connexion d'un utilisateur
    this.io.on('connection', socket => {
      const user = socket.data.user;
      console.log('✅ Un utilisateur est connecté :', user);

      // Pour debug
      socket.on('user-connected', (msg: string) => {
        console.log('🔔 Message reçu :', msg);
        socket.broadcast.emit('user-connected', msg);
      });

      //  Quand un utilisateur rejoint une conversation
      socket.on('joinConversation', (conversationId: string) => {
        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        console.log(`👥 ${user} a rejoint la room :${conversationId}`);

        // notifier les autres membres de la room
        socket.to(roomName).emit('userJoined', {
          userId: user?.id,
          message: `${user?.id} a rejoint la conversation.`,
        });
      });

      // Quand un utilisateur quitte la conversation
      socket.on('leaveConversation', (conversationId: string) => {
        const roomName = `conversation:${conversationId}`;
        socket.leave(roomName);
        console.log(`👋 ${user} a quitté la room conversation:${conversationId}`);
      });

      // Quand un message est envoyé dans une conversation
      socket.on('sendMessage', ({ conversationId, message }) => {
        const roomName = `conversation:${conversationId}`;
        console.log(`💬 Nouveau message de ${user?.id} dans ${roomName} :`, message);

        // Envoi du message uniquement aux membres de la room
        this.io.to(roomName).emit('newMessage', {
          userId: user?.id,
          message,
          conversationId,
          createdAt: new Date(),
        });
      });

      //Quand l'utilisateur se déconnecte
      socket.on('disconnect', reason => {
        console.log(`${user.id} s'est déconnecté(e), cause : ${reason}`);
      });
    });
  }

  public getSocketInstance() {
    return this.io;
  }
}
