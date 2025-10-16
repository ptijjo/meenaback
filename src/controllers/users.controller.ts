import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { UserService } from '../services/users.service';
import { User } from '../interfaces/users.interface';
import { RequestWithUser } from '../interfaces/auth.interface';
import { UpdateUserDto } from '../dtos/users.dto';
import { HttpException } from '../exceptions/httpException';
import { Role } from '@prisma/client';

export class UserController {
  public user = Container.get(UserService);

  public getUsers = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllUsersData: User[] = await this.user.findAllUser();
      res.status(200).json({ data: findAllUsersData, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.id);
      const findOneUserData: User = await this.user.findUserById(userId);

      res.status(200).json({ data: findOneUserData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = String(req.params.id);
      const userId = String(req.user.id);
      const authorRole = String(req.user.role);
      const userData: UpdateUserDto = req.body;

      if (userId !== authorId && authorRole === Role.user) {
        throw new HttpException(404, 'Opération impossible');
      }

      if (req.file && req.file.filename) {
        const url = `${req.protocol}://${req.get('host')}/public/avatar/${req.file.filename}`;

        userData.avatar = url;
      }

      const updateUserData: User = await this.user.updateUser(authorId, userData);

      res.status(200).json({ data: updateUserData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.id);
      const auth = { id: req.user.id as string, role: req.user.role as string };
      const deleteUserData: User = await this.user.deleteUser(userId,auth);

      res.status(200).json({ data: deleteUserData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
