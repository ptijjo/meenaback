import { Router } from 'express';
import { UserController } from '../controllers/users.controller';
import { UpdateUserDto } from '../dtos/users.dto';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import resizeAvatar from '../middlewares/resizeAvatarSecret.middleware';
import Avatar from '../middlewares/uploadAvatarSecret.middleware';
import { RoleGuard } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

export class UserRoute implements Routes {
  public path = '/users';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/`, AuthMiddleware, RoleGuard([Role.admin, Role.modo]), this.user.getUsers);
    this.router.get(`/:id`, AuthMiddleware, RoleGuard([Role.admin, Role.modo]), this.user.getUserById);
   // this.router.patch(`${this.path}/:id`, AuthMiddleware, /*ValidationMiddleware(UpdateUserDto),*/ Avatar, resizeAvatar, this.user.updateUser);
    this.router.delete(`/:id`, AuthMiddleware, this.user.deleteUser);

    this.router.post(`/`, AuthMiddleware, this.user.findUserSecretByUserId);
  }
}
