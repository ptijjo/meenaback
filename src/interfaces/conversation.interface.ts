export interface Conversation {
  id: string;
  isGroup: boolean;
  groupId?: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}
