import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ConversationController } from '../controllers/conversation.controller';
import { AuthSecretMiddleware } from '../middlewares/userSecret.middleware';

export class ConversationRoute implements Routes {
  public path = '/conversations';
  public router = Router();
  public conversationController = new ConversationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /conversations:
     *   post:
     *     tags: [Conversations]
     *     summary: Create or get a conversation
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Conversation created or retrieved
     */
    this.router.post(`/`, AuthMiddleware,AuthSecretMiddleware, this.conversationController.createConversation);
    
    /**
     * @swagger
     * /conversations/find/{friendId}:
     *   get:
     *     tags: [Conversations]
     *     summary: Find conversation by friend ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: friendId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Conversation found
     */
    this.router.get(`/find/:friendId`, AuthMiddleware, AuthSecretMiddleware, this.conversationController.findConversationByFriendId);
    
    /**
     * @swagger
     * /conversations/groupe/{id}:
     *   post:
     *     tags: [Conversations]
     *     summary: Create group conversation
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       201:
     *         description: Group conversation created
     */
    this.router.post("/groupe/:id",AuthMiddleware,AuthSecretMiddleware,this.conversationController.createConversationGroup)

    /**
     * @swagger
     * /conversations:
     *   get:
     *     tags: [Conversations]
     *     summary: Get user conversations
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of user conversations
     */
    this.router.get(`/`, AuthMiddleware, AuthSecretMiddleware, this.conversationController.getUserConversations);
    
    /**
     * @swagger
     * /conversations/{id}:
     *   get:
     *     tags: [Conversations]
     *     summary: Get conversation by ID
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
     *         description: Conversation details
     */
    this.router.get(`/:id`, AuthMiddleware, AuthSecretMiddleware, this.conversationController.getconversationById);
  }
}
