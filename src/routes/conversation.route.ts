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
    this.router.post(`/`, AuthMiddleware,AuthSecretMiddleware, this.conversationController.createConversation);
    this.router.get(`/find/:friendId`, AuthMiddleware, AuthSecretMiddleware, this.conversationController.findConversationByFriendId);
    
    //Groupe de conversation 
    this.router.post("/groupe/:id",AuthMiddleware,AuthSecretMiddleware,this.conversationController.createConversationGroup)

    // (optionnel) récupérer les conversations de l'utilisateur
    this.router.get(`/`, AuthMiddleware, AuthSecretMiddleware, this.conversationController.getUserConversations);
    this.router.get(`/:id`, AuthMiddleware, AuthSecretMiddleware, this.conversationController.getconversationById);
  }
}
