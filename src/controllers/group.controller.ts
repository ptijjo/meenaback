import Container from 'typedi';
import { GroupService } from '../services/group.service';
import { RequestWithUser } from '../interfaces/auth.interface';
import { NextFunction, Response } from 'express';
import { CreateGroupDto, UpdateGroupDto } from '../dtos/group.dto';


export class GroupController {
  private groupService = Container.get(GroupService);

  public findAllGroups = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const groups = await this.groupService.findAllGroups();

      res.status(200).json({ message: 'Liste de tous les groupes', data: groups });
    } catch (error) {
      next(error);
    }
  };

  public findGroupById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const groupId: string = req.params.id;

      const group = this.groupService.findGroupById(groupId);

      res.status(200).json({ message: 'Groupe trouvé', data: group });
    } catch (error) {
      next(error);
    }
  };

  public createGroup = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userSecretId: string = req.userSecret.ID;

      const groupData: CreateGroupDto = req.body;

      const newGroup = await this.groupService.createGroup(userSecretId, groupData);

      res.status(201).json({ message: 'Groupe crée', data: newGroup });
    } catch (error) {
      next(error);
    }
  };

  public updateGroup = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userSecretId: string = req.userSecret.ID;
      const groupData: UpdateGroupDto = req.body;
      const groupId: string = req.params.id;

      const updatedGroup = this.groupService.updateGroup(userSecretId, groupId, groupData);

      res.status(200).json({ message: 'Groupe mis à jour', data: updatedGroup });
    } catch (error) {
      next(error);
    }
  };
    
    public deleteGroup = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        try {
            const userSecretId: string = req.userSecret.ID;
            const groupId: string = req.params.id;
            
             const deletedGroup = this.groupService.deleteGroup(userSecretId, groupId);

      res.status(200).json({ message: 'Groupe supprimé', data: deletedGroup });
        } catch (error) {
            next(error)
        }
    }
}
