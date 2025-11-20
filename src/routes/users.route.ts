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
    /**
     * @swagger
     * /users:
     *   get:
     *     tags: [Users]
     *     summary: Get all users (Admin/Moderator only)
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of users
     */
    this.router.get(`/`, AuthMiddleware, RoleGuard([Role.admin, Role.modo]), this.user.getUsers);
    
    /**
     * @swagger
     * /users/{id}:
     *   get:
     *     tags: [Users]
     *     summary: Get user by ID (Admin/Moderator only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User details
     */
    this.router.get(`/:id`, AuthMiddleware, RoleGuard([Role.admin, Role.modo]), this.user.getUserById);
   // this.router.patch(`${this.path}/:id`, AuthMiddleware, /*ValidationMiddleware(UpdateUserDto),*/ Avatar, resizeAvatar, this.user.updateUser);
    
    /**
     * @swagger
     * /users/{id}:
     *   delete:
     *     tags: [Users]
     *     summary: Delete user
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User deleted
     */
    this.router.delete(`/:id`, AuthMiddleware, this.user.deleteUser);

    /**
     * @swagger
     * /users:
     *   post:
     *     tags: [Users]
     *     summary: Find user secret by user ID
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User secret found
     */
    this.router.post(`/`, AuthMiddleware, this.user.findUserSecretByUserId);
  }
}
