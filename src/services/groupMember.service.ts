import { Service } from 'typedi';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';
import { FriendshipStatus } from '@prisma/client';

@Service()
export class GroupMemberService {
  private member = prisma.groupMember;

  public findAllMember = async (groupId: string) => {
    const allMember = this.member.findMany({
      where: {
        groupId: groupId,
      },
      include: {
        user: true,
      },
    });

    return allMember;
  };

  public findOneMemberInGroupById = async (groupId: string, userId: string) => {
    const member = await this.member.findFirst({
      where: {
        groupId,
        userId,
      },
      include: {
        user: true,
        group: true,
      },
    });

    if (!member) throw new HttpException(404, 'Utilisateur introuvable');

    return member;
  };

  public addMember = async (groupId: string, authorId: string, userId: string) => {
    //On va d'abord voir si le createur du groupe et l'user sont amis

    const isFriends = await prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.accepted,
        OR: [
          { requesterId: authorId, addresseeId: userId },
          { requesterId: userId, addresseeId: authorId },
        ],
      },
    });

    if (!isFriends) throw new HttpException(401, "Impossible d'ajouter un contact non ami !");

    const alreadyMember = await this.member.findFirst({
      where: { userId, groupId },
    });

    if (alreadyMember) {
      throw new HttpException(400, 'Cet utilisateur est déjà membre du groupe !');
    }

    const addMember = await this.member.create({
      data: {
        userId: userId,
        groupId: groupId,
      },
      include: {
        group: true,
        user: true,
      },
    });

    return addMember;
  };

  public rejectMemeber = async (groupMemberId: string, authorId: string) => {
    const user = await this.member.findUnique({
      where: {
        id: groupMemberId,
      },
      include: {
        user: true,
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!user) throw new HttpException(404, 'Groupe introuvable');

    const author = user.group.members.find(auth => auth.userId === authorId);
    if (!author) throw new HttpException(401, 'Vous etes pas authentifié!');

    const deleteMember = await this.member.delete({
      where: {
        id: user.groupId,
      },
    });

    return deleteMember;
  };
}
