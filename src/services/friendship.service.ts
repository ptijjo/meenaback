import Container, { Service } from 'typedi';
import { Friendship } from '../interfaces/friendship.interface';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';
import { CreateNotificationDto } from '../dtos/notifications.dto';
import { FriendshipStatus, NotifiableType, NotificationType } from '@prisma/client';
import { NotificationService } from './notification.service';

@Service()
export class FriendshipService {
  public friendship = prisma.friendship;
  public notification = Container.get(NotificationService);

  // Envoyer une demande d'ami
  public async sendRequest(UserId: string, addresseeId: string): Promise<Friendship> {
    const requesterSecret = await prisma.userSecret.findUnique({
      where: { ID: UserId },
    });

    if (!requesterSecret) throw new HttpException(404, 'UserSecret introuvable pour le demandeur.');

    const requesterId = requesterSecret.ID;

    if (requesterId === addresseeId) throw new HttpException(400, "Impossible de s'ajouter soi-même.");

    const existing = await this.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) throw new HttpException(400, 'Une relation existe déjà.');

    const friendship = await this.friendship.create({
      data: { requesterId, addresseeId, status: 'pending' },
    });

    const type = NotificationType.friend_request;
    const targetType = NotifiableType.friendship;
    const notificationData: CreateNotificationDto = { type, targetType };

    // Notification de demande d'ami
    await this.notification.notifyFriendRequest(
      notificationData,
      friendship.id,
      requesterId, // sender = UserSecret du demandeur
      addresseeId, // receiver = UserSecret du destinataire
    );

    return friendship;
  }

  // Accepter une demande
  public async acceptRequest(userId: string, requesterId: string): Promise<Friendship> {
    const userSecret = await prisma.userSecret.findUnique({ where: { userId: userId } });

    if (!userSecret) throw new HttpException(404, 'Demande introuvable.');

    const friendship = await this.friendship.findFirst({
      where: { requesterId, addresseeId: userSecret.ID, status: 'pending' },
    });

    if (!friendship) throw new HttpException(404, 'Demande introuvable.');

    const response = await this.friendship.update({
      where: { id: friendship.id },
      data: { status: 'accepted' },
    });

    const type = NotificationType.friend_request;
    const targetType = NotifiableType.friendship;
    const notificationData: CreateNotificationDto = { type, targetType };

    // Notification de demande d'ami
    await this.notification.notifyFriendAccept(notificationData, friendship.id, userSecret.ID, requesterId);

    return response;
  }

  // Refuser ou supprimer une demande
  public async rejectOrRemove(userId: string, friendId: string): Promise<{ message: string }> {
    const userSecret = await prisma.userSecret.findUnique({ where: { userId: userId } });

    if (!userSecret) throw new HttpException(404, 'Demande introuvable.');

    const friendship = await this.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userSecret.ID, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userSecret.ID },
        ],
      },
    });

    if (!friendship) throw new HttpException(404, 'Relation introuvable.');

    await prisma.friendship.delete({ where: { id: friendship.id } });

    return { message: 'Relation supprimée avec succès.' };
  }

  // Liste d'amis
  public async getFriends(userId: string): Promise<any> {
    const userSecret = await prisma.userSecret.findUnique({ where: { userId: userId } });

    if (!userSecret) throw new HttpException(404, 'Demande introuvable.');

    const friendships = await this.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        OR: [{ requesterId: userSecret.ID }, { addresseeId: userSecret.ID }],
      },
      include: {
        requester: { include: { user: true } }, // on récupère aussi les infos du User
        addressee: { include: { user: true } },
      },
    });

    friendships.map(f => {
      const isRequester = f.requesterId === userSecret.ID;
      const friend = isRequester ? f.addressee : f.requester; // <-- UserSecret
      return {
        id: friend.ID, // identifiant public (UserSecret.ID)
        name: friend.name, // pseudo public
        avatar: friend.user.avatar, // vient de User
        email: friend.user.email,
        status: friend.user.status,
        since: f.updatedAt,
      };
    });
  }

  // Liste des demandes reçues
  public async getPendingRequests(userId: string): Promise<Friendship[]> {
    const userSecret = await prisma.userSecret.findUnique({ where: { userId: userId } });

    if (!userSecret) throw new HttpException(404, 'Demande introuvable.');

    return await this.friendship.findMany({
      where: { addresseeId: userSecret.ID, status: FriendshipStatus.pending },
      include: { requester: true },
    });
  }
}
