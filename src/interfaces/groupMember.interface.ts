import { RoleGroup } from "@prisma/client";

export interface GroupMember{
    id: string;
    userId: string;
    groupId: string;
    role: RoleGroup;
    joinedAt: Date;
}