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
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true, //pour le 1-1
        group: { include: { members: true } }, //pour le groupe
      },
    });

    if (!conversation) throw new HttpException(404, 'Conversation introuvable');

    //Si c'est une conversation de groupe, vérifier si l'utilisateur est membre du groupe
    if (conversation.isGroup && conversation.group && conversation.groupId) {
      const members = conversation.group.members;
      const isMember = conversation.group.members.some(member => member.userId === senderId);
      if (!isMember) {
        throw new HttpException(401, 'Vous ne pouvez pas envoyer de message dans un groupe dont vous ne faites pas partie!');
      }

      // Liste des destinataires: tous les membres sauf l'émetteur
    const recipientUserIds = members
      .map(m => m.userId)
      .filter(uid => uid !== senderId);

         if (recipientUserIds.length === 0) {
      console.log(`Le groupe ${conversation.groupId} n'avait pas d'autres membres, message créé quand même.`);
    }

      //Creation du message dans le groupe
          const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
           conversation: { connect: { id: conversationId } },
          sender:       { connect: { ID: senderId } },
          content,
        },
        include: { sender: true },
      }),
    ]).then(async ([msg]) => {
      if (recipientUserIds.length > 0) {
        await prisma.messageRecipient.createMany({
          data: recipientUserIds.map(uid => ({
            messageId: msg.id,
            userId: uid,
          })),
          skipDuplicates: true, // évite les erreurs si ré-émission
        });
      }
      return [msg];
    });

    // Si tu veux retourner aussi les destinataires:
    const messageWithRecipients = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: true,
        recipients: { include: { user: true } },
      },
    });

    return messageWithRecipients!;
    }

    //sinon on crée un message dans une conversation 1-1
    // Vérifie si le user fait bien partie de cette conversation
    const isParticipant = conversation.participants.some(p => p.userId === senderId);

    if (!isParticipant) throw new HttpException(401, 'Vous ne pouvez pas envoyer de message dans une conversation dont vous ne faites pas partie!');

    // Trouve le destinataire
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
      include: { sender: true, receiver: true },
    });

    if (!messages) return 'Aucun message disponible';

    return messages;
  }
}
