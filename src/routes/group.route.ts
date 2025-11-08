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
      this.router.get('/', AuthMiddleware, AuthSecretMiddleware, RoleGuard([]), this.controller.findAllGroups);
    this.router.get('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.findGroupById);
    this.router.post('/', AuthMiddleware,AuthSecretMiddleware, ValidationMiddleware(CreateGroupDto), this.controller.createGroup);
    this.router.patch('/:id', AuthMiddleware,AuthSecretMiddleware, ValidationMiddleware(UpdateGroupDto), this.controller.updateGroup);
    this.router.delete('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.deleteGroup);
    
  }
}