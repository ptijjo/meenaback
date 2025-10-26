import Container, { Service } from 'typedi';
import { MessageService } from '../services/message.service';
import { RequestWithUser } from '../interfaces/auth.interface';
import { NextFunction, Response } from 'express';
import { UserSecretService } from '../services/userSecret.service';
import { getIo } from '../utils/socket/socket';

export class MessageController {
  private messageService = Container.get(MessageService);

  public createMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      
      const userId = req.userSecret.ID;
      const { receiverId, content } = req.body;

      console.log('🔍 Conversation check:', { userId, receiverId });

      const message = await this.messageService.createMessage(userId, receiverId, content);

      // Diffuse le message dans la room correspondante
      const io = getIo();
      io.to(`conversation:${message.conversationId}`).emit('newMessage', message);

      res.status(201).json({ status: 'Message crée', data: message });
    } catch (error) {
      next(error);
    }
  };

  public findAll = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const conversationId = String(req.params.id);
      const messages = await this.messageService.getMessage(conversationId);
      res.status(200).json({ status: 'Liste des messages', data: messages });
    } catch (error) {
      next(error);
    }
  };
}
