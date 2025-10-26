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
    // Création ou récupération d'une conversation
    this.router.post(`${this.path}`, AuthMiddleware,AuthSecretMiddleware, this.conversationController.createConversation);

    // (optionnel) récupérer les conversations de l'utilisateur
    this.router.get(`${this.path}`, AuthMiddleware, AuthSecretMiddleware, this.conversationController.getUserConversations);
  }
}
