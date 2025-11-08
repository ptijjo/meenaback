import { Router } from "express";
import { GroupMemberController } from '../controllers/groupMember.controller';
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AuthSecretMiddleware } from "../middlewares/userSecret.middleware";



export class GroupMemberRoute{
     public path = '/groupMember';
      public router = Router();
      private controller = new GroupMemberController();
    
      constructor() {
        this.initializeRoutes();
      }
    
      private initializeRoutes() {
        this.router.get('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.findAllMember);
        this.router.post('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.addMember);
        this.router.delete('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.deleteMember);
        
      }
}