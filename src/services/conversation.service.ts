import { Service } from 'typedi';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';

@Service()
export class ConversationService {
  public createConversation = async (userSecretId: string, friendId: string) => {

    

    //On vérifie si ils sont amis
    if (!userSecretId || !friendId) {
      throw new HttpException(400, 'userId ou friendId manquant');
    }

    const isFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userSecretId, addresseeId: friendId, status: 'accepted' },
          { requesterId: friendId, addresseeId: userSecretId, status: 'accepted' },
        ],
      },
    });

    if (!isFriend) {
      throw new HttpException(401, 'Vous devez être amis pour démarrer une conversation');
    }

    //vérifie si une conversation existe déja
    const existing = await prisma.conversation.findFirst({
      where: {
        participants: {
          some: { userId: { in: [userSecretId, friendId] } },
        },
      },
      include: { participants: true },
    });

    if (existing) return existing;

    //sinon on crée la conversation
    const conversation = await prisma.conversation.create({
      data: {
        author: { connect: { ID: userSecretId } }, // on connecte l'auteur
        participants: {
          create: [{ userId:userSecretId }, { userId: friendId }],
        },
      },
      include: { participants: true },
    });

    return conversation;
  };

  public getConversationByUser = async (userSecretId: string) => {
    let allConversation = await prisma.conversation.findFirst({
      where: {
        authorId: userSecretId,
      },
    });

    if (!allConversation) throw new HttpException(409, 'Acune conversation pour le moment');

    return allConversation;
  };

  public async getUserConversations(userSecretId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId:userSecretId } },
      },
      include: { participants: true },
    });

    return conversations;
  }
}
