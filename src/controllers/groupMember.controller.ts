import Container from 'typedi';
import { GroupMemberService } from '../services/groupMember.service';
import { RequestWithUser } from '../interfaces/auth.interface';
import { NextFunction, Response } from 'express';

export class GroupMemberController {
  private groupMemberService = Container.get(GroupMemberService);

  public findAllMember = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const groupId: string = req.params.id;
      const members = await this.groupMemberService.findAllMember(groupId);

      res.status(200).json({ message: 'Liste de membre', data: members });
    } catch (error) {
      next(error);
    }
  };

  public findOneMember = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
    } catch (error) {
      next(error);
    }
  };

  public addMember = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const groupId: string = req.params.id;
      const authorId: string = req.userSecret.ID;
      const { userId } = req.body;

      const newUser = await this.groupMemberService.addMember(groupId, authorId, userId);
      res.status(201).json({message:"un nouveau membre a été ajouté", data : newUser})
    } catch (error) {
      next(error);
    }
  };

  public deleteMember = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const memberId: string = req.params.id;
      const authorId: string = req.userSecret.ID;

        const userDeleted = await this.groupMemberService.rejectMemeber(memberId, authorId);
        
        res.status(200).json({message:"utilisateur retiré du groupe", data:userDeleted})
    } catch (error) {
      next(error);
    }
  };
}
