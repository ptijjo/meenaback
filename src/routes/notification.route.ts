import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { Routes } from "../interfaces/routes.interface";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AuthSecretMiddleware } from "../middlewares/userSecret.middleware";



export class NotificationRoute implements Routes {
  public path = '/notification';
  public router = Router();
  private controller = new NotificationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', AuthMiddleware,AuthSecretMiddleware, this.controller.getNotification);
    this.router.get('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.updateNotification);
    
  }
}