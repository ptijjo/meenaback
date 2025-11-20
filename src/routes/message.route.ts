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
    /**
     * @swagger
     * /messages:
     *   post:
     *     tags: [Messages]
     *     summary: Create a new message
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               conversationId:
     *                 type: string
     *               content:
     *                 type: string
     *     responses:
     *       201:
     *         description: Message created
     */
    this.router.post(`/`, AuthMiddleware, AuthSecretMiddleware, this.message.createMessage);
    
    /**
     * @swagger
     * /messages/{id}:
     *   get:
     *     tags: [Messages]
     *     summary: Get messages by conversation ID
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
     *         description: List of messages
     */
    this.router.get(`/:id`, AuthMiddleware, AuthSecretMiddleware, this.message.findAll);
  }
}
