import { NextFunction, Response } from 'express';
import { RequestWithUser } from '../interfaces/auth.interface';
import { ConversationService } from '../services/conversation.service';
import Container from 'typedi';
import { UserSecretService } from '../services/userSecret.service';
import { Conversation } from '../interfaces/conversation.interface';

export class ConversationController {
    private conversationService = Container.get(ConversationService);
    private userSecretService = Container.get(UserSecretService);

  public createConversation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
        const { friendId } = req.body;
        const userId = req.userSecret.ID

       console.log("🧩 [createConversation] friendId:", friendId, "userId:", userId);

      const conversation = await this.conversationService.createConversation(userId, friendId);
      console.log("✅ Conversation créée :", conversation);
      res.status(201).json({ data: conversation });
    } catch (error) {
      next(error);
    }
  };

  public getUserConversations = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.userSecret.ID;
      const conversations = await this.conversationService.getUserConversations(userId);
      res.status(200).json({ data: conversations });
    } catch (error) {
      next(error);
    }
  };

  public getconversationById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const conversationId = String(req.params.id);
      const conversation: Conversation = await this.conversationService.getConversationById(conversationId);
      res.status(200).json({message:"Find conversation",data:conversation})
    } catch (error) {
      next(error)
    }
    const conversationId = String(req.params.id);
    const conversation:Conversation = await this.conversationService.getConversationById(conversationId)
  }
}
