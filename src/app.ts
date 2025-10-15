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

type MorganFormat = 'dev' | 'combined';
const LOG_FORMAT_MORGAN: MorganFormat = (LOG_FORMAT as MorganFormat) || 'dev';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
  public redisClient: RedisClientType;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 8585;
    this.server = http.createServer(this.app);
    this.redisClient = createClient({
        url: `redis://:${process.env.REDIS_PASSWORD}@localhost:6379`,
    });
    this.redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.redisConnect();
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
      this.app.use('/', route.router);
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
}
