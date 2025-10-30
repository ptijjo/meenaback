import { Service } from 'typedi';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';
@Service()
export class MessageService {
 
  public async createMessage(senderId: string, conversationId: string, content: string) {
    if (!senderId || !conversationId || !content) {
      throw new HttpException(400, 'Données incomplètes pour envoyer le message');
    }

    //verifier si la conversation existe
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { participants: true, } });

    if (!conversation) throw new HttpException(404, 'Conversation introuvable');

    // Vérifie si le user fait bien partie de cette conversation
    const isParticipant = conversation.participants.some(p => p.userId === senderId);
 
    if (!isParticipant) throw new HttpException(401, 'Vous ne pouvez pas envoyer de message dans une conversation dont vous ne faites pas partie!');

    const receiver = conversation.participants.find(p => p.userId !== senderId);
    if (!receiver) throw new HttpException(400, 'Aucun destinataire trouvé dans la conversation');

    //Creation du message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId: receiver.userId,
        content,
      },
      include: { sender: true },
    });

    return message;
  }

  public async getMessage(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: true,receiver:true },
    });

    if (!messages) return 'Aucun message disponible';

    return messages;
  }
}
