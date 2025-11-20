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
        /**
         * @swagger
         * /groupMember/{id}:
         *   get:
         *     tags: [GroupMembers]
         *     summary: Get all members of a group
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
         *         description: List of group members
         */
        this.router.get('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.findAllMember);
        
        /**
         * @swagger
         * /groupMember/{id}:
         *   post:
         *     tags: [GroupMembers]
         *     summary: Add member to group
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       201:
         *         description: Member added
         */
        this.router.post('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.addMember);
        
        /**
         * @swagger
         * /groupMember/{id}:
         *   delete:
         *     tags: [GroupMembers]
         *     summary: Remove member from group
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
         *         description: Member removed
         */
        this.router.delete('/:id', AuthMiddleware,AuthSecretMiddleware, this.controller.deleteMember);
        
      }
}