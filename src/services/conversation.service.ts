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
        AND: [{ participants: { some: { userId: userSecretId } } }, { participants: { some: { userId: friendId } } }],
      },
      include: { participants: true },
    });

    if (existing) return existing;

    try {
      const conversation = await prisma.conversation.create({
        data: {
          author: { connect: { ID: userSecretId } }, // on connecte l'auteur
          participants: {
            create: [
              { user: { connect: { ID: userSecretId } } },
              { user: { connect: { ID: friendId } } }
            ],
          },
        },
        include: {
          participants: {
            include: {
              user:true
            }
          } 
        },
      });
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

    if (!conversation) throw new HttpException(404, 'Conversation introuvable !');

    return conversation;
  };

  public findConversationByFriendId = async (userSecretId: string, friendId: string) => {
    // Vérifie si une conversation existe déjà entre ces deux utilisateurs
    const existing = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [userSecretId, friendId]
            }
          }
        }
      },
      include: {
        author:true,
        participants: {
          include: {
            user:true
          }
        }
      }
    });

    if (existing) {
      return existing;
    }

    const newConv = await prisma.conversation.create({
      data: {
        author: {
          connect: { ID: userSecretId },
        },
        participants: {
          create: [
            { userId: userSecretId },
            { userId: friendId }
          ],
        }
      }
    });

    return newConv;
  };

  public createConversationGroup = async (groupId: string,) => {
    //On recherche le groupe ainsi que tous ces participants
    const group = await prisma.group.findUnique({
      where: {
        id: groupId
      },
      include: {
        members: true,
        conversation:true,
      }
    });

    if (!group) throw new HttpException(404, "Groupe introuvable !");
    if(group.conversation) throw new HttpException(401,"Une conversation existe déja")

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        groupId: group.id,
        name: group.name,
        avatar: "https://vibz.s3.eu-central-1.amazonaws.com/logo/photoProfil.png",
        authorId: group.createdById
      },
      include: {
        participants:true
      }
    });

    //  ajout des participants
     await prisma.conversationParticipant.createMany({
      data: group.members.map(member => ({
        userId: member.userId,
        conversationId:conversation.id
      })),
      skipDuplicates:true,
    });

    return conversation;
  }
}
