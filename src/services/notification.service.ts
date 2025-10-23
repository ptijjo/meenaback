import  { Service } from 'typedi';
import prisma from '../utils/prisma';
import { Notifications } from '../interfaces/notification.interface';
import { HttpException } from '../exceptions/httpException';
import { CreateNotificationDto } from '../dtos/notifications.dto';



@Service()
export class NotificationService {
  private notification = prisma.notification;


  public async getNotifications(): Promise<Notifications[]> {
    const notifications: Notifications[] | null = await this.notification.findMany();

    return notifications;
  }

  public async getNewsNotifications(): Promise<Notifications[]> {
    const notifications: Notifications[] | null = await this.notification.findMany({ where: { read: false } });

    return notifications;
  }

  public async getNotificationById(notificationId: string): Promise<Notifications> {
    const notification: Notifications | null = await this.notification.findUnique({ where: { id: notificationId, read: false } });

    if (!notification) throw new HttpException(409, 'Pas de nouvelles notifications!');

    return notification;
  }

  public async notifyFriendRequest(notifData: CreateNotificationDto, targetId: string, senderId: string, receiverId: string): Promise<Notifications> {

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
  }

  public async notifyFriendAccept(notifData: CreateNotificationDto, targetId: string, senderId: string, receiverId: string): Promise<Notifications> {
   
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
  }
}
