import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { MessageController } from '../controllers/message.controller';
import { AuthSecretMiddleware } from '../middlewares/userSecret.middleware';

export class MessageRoute implements Routes {
  public path = '/messages';
  public router = Router();
  public message = new MessageController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/`, AuthMiddleware, AuthSecretMiddleware, this.message.createMessage);
    this.router.get(`/:id`, AuthMiddleware, AuthSecretMiddleware, this.message.findAll);
  }
}
