import Container, { Service } from 'typedi';
import { MessageService } from '../services/message.service';
import { RequestWithUser } from '../interfaces/auth.interface';
import { NextFunction, Response } from 'express';
import { UserSecretService } from '../services/userSecret.service';
import { getIo } from '../utils/socket/socket';
import prisma from '../utils/prisma';

export class MessageController {
  private messageService = Container.get(MessageService);

  public createMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.userSecret.ID;
      const { conversationId, content } = req.body;

      const message = await this.messageService.createMessage(userId, conversationId, content);

      // Diffuse le message dans la room correspondante
      const io = getIo();
      const roomName = `conversation:${message.conversationId}`;
      console.log(`✅ Tentative de diffusion du message ${message.id} dans la room : ${roomName}`);
      io.to(roomName).emit('newMessage', message);

      res.status(201).json({ status: 'Message crée', data: message });
    } catch (error) {
      next(error);
    }
  };

  public findAll = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const conversationId = String(req.params.id);

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation introuvable' });
      }

      const messages = await this.messageService.getMessage(conversationId);
      res.status(200).json({ status: 'Liste des messages', data: messages });
    } catch (error) {
      next(error);
    }
  };
}
