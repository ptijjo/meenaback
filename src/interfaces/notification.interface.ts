import { NotifiableType, NotificationType } from "@prisma/client";

export interface Notifications {
  id: string;
  type: NotificationType;
  targetId: string;
  targetType: NotifiableType;
  read: boolean;
  createdAt: Date;
  delivered: boolean;
  seenAt?: Date;
  receiverId: string;
  senderId: string;
}
