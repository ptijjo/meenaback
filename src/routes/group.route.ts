import { Router } from "express";
import { GroupController } from "../controllers/group.controller";
import { Routes } from "../interfaces/routes.interface";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AuthSecretMiddleware } from "../middlewares/userSecret.middleware";
import { RoleGuard } from "../middlewares/role.middleware";
import { Role } from "@prisma/client";
import { ValidationMiddleware } from "../middlewares/validation.middleware";
import { CreateGroupDto, UpdateGroupDto } from "../dtos/group.dto";




export class GroupRoute implements Routes {
  public path = '/groups';
  public router = Router();
  private controller = new GroupController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /groups:
     *   get:
     *     tags: [Groups]
     *     summary: Get all groups
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of groups
     */
    this.router.get('/', AuthMiddleware, AuthSecretMiddleware, RoleGuard([]), this.controller.findAllGroups);
    
    /**
     * @swagger
     * /groups/{id}:
     *   get:
     *     tags: [Groups]
     *     summary: Get group by ID
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
     *         description: Group details
     */
    this.router.get('/:id', AuthMiddleware,AuthSecretMiddleware,RoleGuard([]), this.controller.findGroupById);
    
    /**
     * @swagger
     * /groups:
     *   post:
     *     tags: [Groups]
     *     summary: Create a new group
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       201:
     *         description: Group created
     */
    this.router.post('/', AuthMiddleware,AuthSecretMiddleware, ValidationMiddleware(CreateGroupDto), this.controller.createGroup);
    
    /**
     * @swagger
     * /groups/{id}:
     *   patch:
     *     tags: [Groups]
     *     summary: Update group
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
     *         description: Group updated
     */
    this.router.patch('/:id', AuthMiddleware,AuthSecretMiddleware, ValidationMiddleware(UpdateGroupDto), this.controller.updateGroup);
    
    /**
     * @swagger
     * /groups/{id}:
     *   delete:
     *     tags: [Groups]
     *     summary: Delete group
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
     *         description: Group deleted
     */
    this.router.delete('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.deleteGroup);
    
  }
}