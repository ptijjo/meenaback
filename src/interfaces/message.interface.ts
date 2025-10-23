import { TypeMessage } from '@prisma/client';

export interface Message {
  id: string;
  content: string;
  type: TypeMessage;
  attachmentUrl?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  senderId: string;
  conversationId: string;
}
