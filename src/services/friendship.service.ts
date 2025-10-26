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
  public async sendRequest(userSecretId: string, addresseeId: string): Promise<Friendship> {
    


    if (userSecretId === addresseeId) throw new HttpException(400, "Impossible de s'ajouter soi-même.");

    const existing = await this.friendship.findFirst({
      where: {
        OR: [
          { requesterId:userSecretId, addresseeId },
          { requesterId: addresseeId, addresseeId: userSecretId },
        ],
      },
    });

    if (existing) throw new HttpException(400, 'Une relation existe déjà.');

    const friendship = await this.friendship.create({
      data: {
        requester: { connect: { ID: userSecretId } },
        addressee: { connect: { ID: addresseeId } },
        status: 'pending',
      },
    });

    const type = NotificationType.friend_request;
    const targetType = NotifiableType.friendship;
    const notificationData: CreateNotificationDto = { type, targetType };

    // Notification de demande d'ami
    await this.notification.notifyFriendRequest(
      notificationData,
      friendship.id,
      userSecretId, // sender = UserSecret du demandeur
      addresseeId, // receiver = UserSecret du destinataire
    );

    return friendship;
  }

  // Accepter une demande
  public async acceptRequest(addresseeId: string, requesterId: string): Promise<Friendship> {
   
    const friendship = await this.friendship.findFirst({
      where: { requesterId, addresseeId, status: 'pending' },
    });

    if (!friendship) throw new HttpException(404, 'Demande d amitié introuvable.');

    const response = await this.friendship.update({
      where: { id: friendship.id },
      data: { status: 'accepted' },
    });

    const type = NotificationType.friend_request;
    const targetType = NotifiableType.friendship;
    const notificationData: CreateNotificationDto = { type, targetType };

    // Notification de demande d'ami
    await this.notification.notifyFriendAccept(notificationData, friendship.id, addresseeId, requesterId);

    return response;
  }

  // Refuser ou supprimer une demande
  public async rejectOrRemove(userSecretId: string, friendId: string): Promise<{ message: string }> {
   
    const friendship = await this.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userSecretId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userSecretId },
        ],
      },
    });

    if (!friendship) throw new HttpException(404, 'Relation introuvable.');

    await prisma.friendship.delete({ where: { id: friendship.id } });

    return { message: 'Relation supprimée avec succès.' };
  }

  // Liste d'amis
  public async getFriends(userSecretId: string): Promise<any> {

    const friendships = await this.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        OR: [{ requesterId: userSecretId }, { addresseeId: userSecretId }],
      },
      include: {
        requester: { include: { user: true } }, // on récupère aussi les infos du User
        addressee: { include: { user: true } },
      },
    });

    const friendsList = friendships.map(f => {
      const isRequester = f.requesterId === userSecretId;
      const friend = isRequester ? f.addressee : f.requester; // <-- UserSecret
      return {
        id: friend.ID, // identifiant public (UserSecret.ID)
        name: friend.name, // pseudo public
        avatar: friend.user.avatar, // vient de User
        status: friend.user.status,
        since: f.updatedAt,
      };
    });
    return friendsList;
  }

  // Liste des demandes reçues
  public async getPendingRequests(userSecretId: string): Promise<Friendship[]> {

    return await this.friendship.findMany({
      where: { addresseeId: userSecretId, status: FriendshipStatus.pending },
      include: { requester: true },
    });
  }
}
