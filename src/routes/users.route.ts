import { Router } from 'express';
import { UserController } from '../controllers/users.controller';
import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { Routes } from '../interfaces/routes.interface';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import resizeAvatar from '../middlewares/resizeAvatar.middleware';
import Avatar from '../middlewares/uploadAvatar.middleware';
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
    this.router.get(`${this.path}`, AuthMiddleware,RoleGuard([Role.admin, Role.modo]), this.user.getUsers);
    this.router.get(`${this.path}/:id`, AuthMiddleware, RoleGuard([Role.admin, Role.modo]), this.user.getUserById);
    this.router.patch(`${this.path}/:id`, AuthMiddleware, /*ValidationMiddleware(UpdateUserDto),*/ Avatar, resizeAvatar, this.user.updateUser);
    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.user.deleteUser);
  }
}
