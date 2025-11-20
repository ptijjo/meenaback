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
    /**
     * @swagger
     * /userSecrets:
     *   get:
     *     tags: [UserSecrets]
     *     summary: Get all user secrets (Admin/Moderator only)
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of user secrets
     */
    this.router.get(`/`, AuthMiddleware, AuthSecretMiddleware,RoleGuard([Role.admin, Role.modo]), this.user.getUsers);
    
    /**
     * @swagger
     * /userSecrets/{id}:
     *   get:
     *     tags: [UserSecrets]
     *     summary: Get user secret by ID (Admin/Moderator only)
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
     *         description: User secret details
     */
    this.router.get(`/:id`, AuthMiddleware, AuthSecretMiddleware,RoleGuard([Role.admin, Role.modo]), this.user.getUserById);
    
    /**
     * @swagger
     * /userSecrets:
     *   post:
     *     tags: [UserSecrets]
     *     summary: Get user secret by ID from body
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *     responses:
     *       200:
     *         description: User secret found
     */
    this.router.post(`/`, AuthMiddleware, AuthSecretMiddleware,RoleGuard([]), this.user.getUserByIdBody);
    
    /**
     * @swagger
     * /userSecrets/{id}:
     *   patch:
     *     tags: [UserSecrets]
     *     summary: Update user secret with avatar
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               avatar:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: User secret updated
     */
    this.router.patch(`/:id`, AuthMiddleware, AuthSecretMiddleware, AvatarSecret, resizeAvatarSecret, this.user.updateUser);
    
  }
}
