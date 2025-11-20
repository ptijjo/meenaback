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
    /**
     * @swagger
     * /notification:
     *   get:
     *     tags: [Notifications]
     *     summary: Get user notifications
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of notifications
     */
    this.router.get('/', AuthMiddleware,AuthSecretMiddleware, this.controller.getNotification);
    
    /**
     * @swagger
     * /notification/{id}:
     *   get:
     *     tags: [Notifications]
     *     summary: Mark notification as read
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Notification updated
     */
    this.router.get('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.updateNotification);
    
  }
}