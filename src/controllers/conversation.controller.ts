import { NextFunction, Response } from 'express';
import { RequestWithUser } from '../interfaces/auth.interface';
import { ConversationService } from '../services/conversation.service';
import Container from 'typedi';
import { UserSecretService } from '../services/userSecret.service';
import { Conversation } from '../interfaces/conversation.interface';

export class ConversationController {
  private conversationService = Container.get(ConversationService);
  

  public createConversation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { friendId } = req.body;
      const userId = req.userSecret.ID;

      const conversation = await this.conversationService.createConversation(userId, friendId);
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
      res.status(200).json({ message: 'Find conversation', data: conversation });
    } catch (error) {
      next(error);
    }
  };

  public findConversationByFriendId = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userSecretId = req.userSecret.ID;
      const friendId = req.params.friendId;
      const existing = await this.conversationService.findConversationByFriendId(userSecretId, friendId);
      
      res.status(200).json({ message: "Conversation chat", data: existing });
    } catch (error) {
      next(error);
    }
  };
}
