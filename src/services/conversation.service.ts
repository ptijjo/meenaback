import { Service } from 'typedi';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';

@Service()
export class ConversationService {
  public async createConversation(userId: string, friendId: string) {
    //On vérifie si ils sont amis
    const isFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
        status: 'accepted',
      },
    });

    if (!isFriend) {
      throw new HttpException(401, 'Vous devez être amis pour démarrer une conversation');
    }

    //vérifie si une conversation existe déja
    const existing = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: { userId: { in: [userId, friendId] } },
        },
      },
      include: { participants: true },
    });

    if (existing) return existing;

    //sinon on crée la conversation
    const conversation = await prisma.conversation.create({
        data: {
          author:{connect:{ID:userId}}, // on connecte l'auteur
        participants: {
          create: [{ userId }, { userId: friendId }],
        },
      },
      include: { participants: true },
    });
      
      return conversation;
  }
}
