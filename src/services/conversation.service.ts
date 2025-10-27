import { Service } from 'typedi';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';
import { UserSecret } from '../interfaces/userSecret.interface';

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
        AND: [{ participants: { some: { userId: userSecretId } } }, { participants: { some: { userId: friendId } } }],
      },
      include: { participants: true },
    });

    if (existing) return existing;

    try {
      //sinon on crée la conversation
      console.log('🧠 Création de conversation entre', userSecretId, 'et', friendId);
      const conversation = await prisma.conversation.create({
        data: {
          author: { connect: { ID: userSecretId } }, // on connecte l'auteur
          participants: {
            create: [{ user: { connect: { ID: userSecretId } } }, { user: { connect: { ID: friendId } } }],
          },
        },
        include: { participants: true },
      });
      console.log('✅ Conversation créée avec id:', conversation.id);
      return conversation;
    } catch (error) {
      console.error('❌ Erreur Prisma :', error);
      throw new HttpException(500, 'Erreur Prisma lors de la création de conversation');
    }
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

  public getUserConversations = async (userSecretId: string) => {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: userSecretId } },
      },
      include: { participants: true },
    });

    return conversations;
  };

  public getConversationById = async (conversationId: string) => {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });

    if (!conversation) throw new HttpException(409, 'Conversation introuvable !');

    return conversation;
  };
}
