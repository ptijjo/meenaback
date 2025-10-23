import Container, { Service } from 'typedi';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';
import { Conversation } from '../interfaces/conversation.interface';
import { Message } from '../interfaces/message.interface';
import { socketInstance } from '../server';
import { ConversationService } from './conversation.service';

@Service()
export class MessageService {
  private conversation = Container.get(ConversationService);

  public async createMessage(senderId: string, receiverId: string, content: string) {
    //verifier si la conversation existe
    const conversation: Conversation = await this.conversation.createConversation(senderId, receiverId);

    // Vérifie si le user fait bien partie de cette conversation
    const isParticipant = await prisma.conversation.findFirst({
      where: {
        id: conversation.id,
        participants: {
          some: { userId: senderId },
        },
      },
    });

    if (!isParticipant) throw new HttpException(401, 'Vous ne pouvez pas envoyer de message dans une conversation dont vous ne faites pas partie!');

    //Creation du message
    const message: Message = await prisma.message.create({
      data: {
        conversationId:conversation.id,
        senderId,
        content,
      },
      include: { sender: true },
    });

    //On diffuse le message
    socketInstance.to(`conversation:${conversation.id}`).emit('newMessage', message);
    return message;
  }

  public async getMessage(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });

    if (!messages) return 'Aucun message disponible';

    return messages;
  }
}
