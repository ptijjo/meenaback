import { Service } from 'typedi';
import prisma from '../utils/prisma';
import { Notifications } from '../interfaces/notification.interface';
import { HttpException } from '../exceptions/httpException';
import { CreateNotificationDto } from '../dtos/notifications.dto';
import { NotifiableType, NotificationType } from '@prisma/client';

@Service()
export class NotificationService {
  private notification = prisma.notification;

  public getNotifications = async (): Promise<Notifications[]> => {
    const notifications: Notifications[] | null = await this.notification.findMany();

    return notifications;
  };

public getNewsNotifications = async (userId: string): Promise<Notifications[]> => {
  const relevantTargetTypes: NotifiableType[] = ['friendship']; 

  const notifications = await this.notification.findMany({
    where: {
      read: false,
      targetType: { in: relevantTargetTypes },
      receiverId: userId, 
      OR: [
        {
          type: 'friend_request',
          targetType: 'friendship',
        },
        {
          type: 'friend_accept',
          targetType: 'friendship',
        },
      ],
    },
    include: {
      sender: true,
      receiver:true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return notifications;
};

  
  
  public getNotificationById = async (notificationId: string): Promise<Notifications> => {
    const notification: Notifications | null = await this.notification.findUnique({ where: { id: notificationId, read: false } });

    if (!notification) throw new HttpException(409, 'Pas de nouvelles notifications!');

    return notification;
  };

  public notifyFriendRequest = async (
    notifData: CreateNotificationDto,
    targetId: string,
    senderId: string,
    receiverId: string,
  ): Promise<Notifications> => {
    const newNotification: Notifications = await this.notification.create({
      data: {
        type: notifData.type,
        targetId,
        targetType: notifData.targetType,
        senderId,
        receiverId, // celui qui reçoit la notif
        meta: { message: "Nouvelle demande d'ami reçue" },
      },
    });

    return newNotification;
  };

  public notifyFriendAccept = async (
    notifData: CreateNotificationDto,
    targetId: string,
    senderId: string,
    receiverId: string,
  ): Promise<Notifications> => {
    const newNotification: Notifications = await this.notification.create({
      data: {
        type: notifData.type,
        targetType: notifData.targetType,
        targetId,
        senderId, // celui qui accepte
        receiverId, // celui qui recoit la notif
      },
    });

    return newNotification;
  };
}
