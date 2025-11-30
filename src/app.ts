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
    // Adapte au proxy Nginx qui pointe sur localhost:8800
    this.port = PORT || 8800;
    this.server = http.createServer(this.app);

    this.io = require('socket.io')(this.server, {
      cors: {
        origin: ORIGIN,
        credentials: CREDENTIALS,
      },
    });

    setIo(this.io);

    this.redisClient = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@localhost:6379`,
    });
    this.subRedisClient = this.redisClient.duplicate();

    this.redisClient.on('error', err => console.error('❌ Redis Client Error', err));
    this.subRedisClient.on('error', err => console.error('❌ SubRedis Client Error', err));

    Promise.all([this.redisClient.connect(), this.subRedisClient.connect()])
      .then(() => {
        this.io.adapter(createAdapter(this.redisClient, this.subRedisClient));
        logger.info('✅ Socket.IO Redis Adapter initialized.');
      })
      .catch(err => {
        logger.error('❌ Failed to initialize Redis Adapter:', err);
      });

    async () => await this.redisConnect();
    async () => await this.initializeSocketAdapter();

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeSocket();
  }

  public listen() {
    this.server.listen({ port: this.port, host: '0.0.0.0' }, () => {
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
    // Chemin absolu du public à la racine du projet
    const __rootDir = path.resolve(__dirname, ".."); // remonte depuis dist vers racine
    const publicPath = path.join(__rootDir, 'public');

    this.app.set('trust proxy', 1);
    this.app.use('/public', express.static(publicPath));
    this.app.use(morgan(LOG_FORMAT_MORGAN, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
      }),
    );
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
    // Chemins absolus pour éviter les problèmes de résolution depuis dist/
    const __rootDir = path.resolve(__dirname, '..');
    
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Meena API',
          version: '1.0.0',
          description: 'API documentation for Meena backend',
        },
        // Utilise une URL relative pour être compatible derrière Nginx
        servers: [
          {
            url: '/',
            description: this.env === 'development' ? 'Development server' : 'Server behind proxy',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      // Toujours scanner les sources TypeScript car SWC supprime les commentaires JSDoc
      apis: [
        path.join(__rootDir, 'src/routes/*.ts'),
        path.join(__rootDir, 'src/controllers/*.ts'),
      ],
    };

    logger.info(`📂 Swagger scanning: ${options.apis.join(', ')}`);

    let specs;
    try {
      specs = swaggerJSDoc(options);
      logger.info(`📄 Swagger spec generated with ${Object.keys(specs.paths || {}).length} endpoints`);
    } catch (error) {
      logger.error('❌ Failed to generate Swagger spec:', error);
      specs = { openapi: '3.0.0', info: options.definition.info, paths: {} };
    }
    
    // Expose raw OpenAPI JSON at root and under /api for compatibility
    this.app.get('/api-docs.json', (_req, res) => {
      res.type('application/json').send(specs);
    });
    this.app.get('/api/api-docs.json', (_req, res) => {
      res.type('application/json').send(specs);
    });
    
    // Mount Swagger UI qui consomme les endpoints JSON (validation automatique)
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(undefined, {
      swaggerOptions: { url: '/api-docs.json' }
    }));
    this.app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(undefined, {
      swaggerOptions: { url: '/api/api-docs.json' }
    }));

    logger.info('✅ Swagger UI mounted at /api-docs and /api/api-docs');
    logger.info('✅ Swagger JSON available at /api-docs.json and /api/api-docs.json');
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
    } catch (error) {
      console.error("❌ Erreur lors de la configuration de l'adaptateur Redis :", error);
    }
  }

  private initializeSocket() {
    // Middleware d'authentification Socket.IO
    this.io.use((socket, next) => {
      socketAuthMiddleware(socket, err => {
        if (err) {
          console.error(`⚠️ Auth échouée pour socket ${socket.ID}: ${err.message}`);
          return next(err);
        }
        console.log('🧩 Auth handshake reçu :', socket.handshake.auth);
        next();
      });
    });

    // Connexion d'un utilisateur
    this.io.on('connection', socket => {
      const user = socket.data.user;

      /**
       **Chaque utilisateur rejoint sa "room privée"
       * pour recevoir ses notifications en direct.
       */
      if (user?.ID) {
        socket.join(`user:${user.ID}`);
      }

      // Pour debug
      socket.on('user-connected', (msg: string) => {
        socket.broadcast.emit('user-connected', msg);
      });

      //  Quand un utilisateur rejoint une conversation
      socket.on('joinConversation', (conversationId: string) => {
        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        console.log(`💬 ${user?.friendId || user?.ID} a rejoint la room ${roomName}`);

        // notifier les autres membres de la room
        socket.to(roomName).emit('userJoined', {
          userId: user?.ID,
          message: `${user?.ID} a rejoint la conversation.`,
        });
      });

      // Quand un utilisateur quitte la conversation
      socket.on('leaveConversation', (conversationId: string) => {
        const roomName = `conversation:${conversationId}`;
        socket.leave(roomName);
      });

      // Quand un message est envoyé dans une conversation
      socket.on('sendMessage', ({ conversationId, message }) => {
        const roomName = `conversation:${conversationId}`;
        console.log(`🗨️ Message de ${user?.friendId || user?.ID} dans ${roomName} :`, message);

        // Envoi du message uniquement aux membres de la room
        this.io.to(roomName).emit('newMessage', {
          userId: user?.nameSecret,
          message,
          conversationId,
          createdAt: new Date(),
        });
      });

      //Envoi des notifications au front
      socket.on('sendNotification', ({ receiverId, notification }) => {
        const roomName = `user:${receiverId}`;
        this.io.to(roomName).emit('newNotification', notification);
      });

      //Quand l'utilisateur se déconnecte
      socket.on('disconnect', reason => {
        console.log(`${user.ID} s'est déconnecté(e), cause : ${reason}`);
      });
    });
  }

  public getSocketInstance() {
    return this.io;
  }
}
