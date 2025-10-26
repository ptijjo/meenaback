import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleGuard } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';
import { UserSecretController } from '../controllers/userSecret.controller';
import { AuthSecretMiddleware } from '../middlewares/userSecret.middleware';
import AvatarSecret from '../middlewares/uploadAvatarSecret.middleware';
import resizeAvatarSecret from '../middlewares/resizeAvatarSecret.middleware';

export class UserSecretRoute implements Routes {
  public path = '/userSecrets';
  public router = Router();
  public user = new UserSecretController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/`, AuthMiddleware, AuthSecretMiddleware,RoleGuard([Role.admin, Role.modo]), this.user.getUsers);
    this.router.get(`/:id`, AuthMiddleware, AuthSecretMiddleware,RoleGuard([Role.admin, Role.modo]), this.user.getUserById);
    this.router.patch(`/:id`, AuthMiddleware, AuthSecretMiddleware, AvatarSecret, resizeAvatarSecret, this.user.updateUser);
    
  }
}
