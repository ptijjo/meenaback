import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '../interfaces/auth.interface';
import { HttpException } from '../exceptions/httpException';
import { Role } from '@prisma/client';
import { UserSecretService } from '../services/userSecret.service';
import { UserSecret } from '../interfaces/userSecret.interface';
import { UpdateUserSecretDto } from '../dtos/userSecrets.dto';

export class UserSecretController {
  public userSecret = Container.get(UserSecretService);

  public getUsers = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllUsersData: UserSecret[] = await this.userSecret.findAllUser();
      res.status(200).json({ data: findAllUsersData, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.id);
      const findOneUserSecretData: UserSecret = await this.userSecret.findUserSecretById(userId);

      res.status(200).json({ data: findOneUserSecretData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public getUserByIdBody = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.body;
      const findOneUserSecretData: UserSecret = await this.userSecret.findUserSecretById(userId);

      res.status(200).json({ data: findOneUserSecretData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const authorId = String(req.params.id);
      const userSecretId = String(req.userSecret.ID);
      const authorRole = String(req.user.role);
      const userData: UpdateUserSecretDto = req.body;

      if (userSecretId !== authorId && authorRole === Role.user) {
        throw new HttpException(404, 'Opération impossible');
      }

      if (req.file && req.file?.filename) {
        delete (req.body as any).avatar;

        const url = `${req.protocol}://${req.get('host')}/public/avatarSecret/${req.file.filename}`;
        userData.avatarSecret = url;
      }

      const updateUserSecretData = await this.userSecret.updateUserSecret(userSecretId, userData);

      return res.status(200).json({ data: updateUserSecretData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };
}
