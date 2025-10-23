import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { MessageController } from '../controllers/message.controller';


export class MessageRoute implements Routes {
  public path = '/messages';
  public router = Router();
  public message = new MessageController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, AuthMiddleware, this.message.createMessage);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.message.findAll);
  }
}
