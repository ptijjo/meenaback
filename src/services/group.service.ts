import { Service } from 'typedi';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';
import { CreateGroupDto, UpdateGroupDto } from '../dtos/group.dto';
import { RoleGroup } from '@prisma/client';


@Service()
export class GroupService {
  private group = prisma.group;

  public findAllGroups = async () => {
    let groups = await this.group.findMany({
      include: {
        members: true,
        createdBy: true,
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!groups) groups = [];

    return groups;
  };

  public findGroupById = async (groupId: string) => {
    const group = await this.group.findUnique({
      where: {
        id: groupId,
      },
      include: {
        members: true,
        createdBy: true,
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!group) throw new HttpException(404, 'Groupe introuvable !');

    return group;
  };

  public createGroup = async (userSecretId: string, groupData: CreateGroupDto) => {
    const author = await prisma.userSecret.findUnique({
      where: {
        ID: userSecretId,
      },
      include: {
        groupsCreated: true,
      },
    });

    if (!author) throw new HttpException(404, 'Utilisateur non connecté');

    if (author.groupsCreated.length > 3) throw new HttpException(401, 'Vous ne pouvez pas payer plus de groupes !');

    const newGroup = await this.group.create({
      data: {
        ...groupData,
        createdById: author.ID,
        conversation: {
          create: {
            isGroup: true,
            name: groupData.name,
            authorId: author.ID,
            avatar: "../assets/logo/meena.png",
          },
        },
      },
      include: {
        conversation: true,
      },
    });

    await prisma.groupMember.create({
      data: {
        userId: newGroup.createdById,
        groupId: newGroup.id,
        role:RoleGroup.admin
      }
    })

    return newGroup;
  };

  public updateGroup = async (authorId:string,groupId: string, groupData: UpdateGroupDto) => {
    const group = await this.group.findUnique({
      where: {
        id: groupId,
      },include: {
        members: true,
        createdBy: true,
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

      if (!group) throw new HttpException(404, 'Groupe introuvable !');
      
      //on va rechercher le createur du groupe
      const author = group.members.find(auth => auth.userId === authorId);
      
      if (!author) throw new HttpException(404, "Vous etes pas memebre du groupe");

      if(author.role != RoleGroup.admin) throw new HttpException(401,"Vous n'ètes pas gérant du groupe ! ")

    const updateGroup = await this.group.update({
      where: {
        id: groupId,
      },
      data: {
        ...groupData,
      },
      include: {
        members: true,
        createdBy: true,
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

    return updateGroup;
  };

  public deleteGroup = async (authorId:string,groupId: string) => {
    const group = await this.group.findUnique({
      where: {
        id: groupId,
      },include: {
        members: true,
        createdBy: true,
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

      if (!group) throw new HttpException(404, 'Groupe introuvable !');

      //on va rechercher le createur du groupe
      const author = group.members.find(auth => auth.userId === authorId);
      
      if (!author) throw new HttpException(404, "Vous etes pas memebre du groupe");

      if(author.role != RoleGroup.admin) throw new HttpException(401,"Vous n'ètes pas gérant du groupe ! ")
      
      const groupDelete = await this.group.delete({
          where: {
              id: groupId
          }
      });

      return groupDelete;
  };
}
