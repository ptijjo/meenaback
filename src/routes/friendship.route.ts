import { Router } from 'express';
import { FriendshipController } from '../controllers/friendship.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { AuthSecretMiddleware } from '../middlewares/userSecret.middleware';

export class FriendshipRoute {
  public path = '/friends';
  public router = Router();
  public controller = new FriendshipController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /friends/send:
     *   post:
     *     tags: [Friendship]
     *     summary: Send friend request
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Friend request sent
     */
    this.router.post(`/send`, AuthMiddleware, AuthSecretMiddleware, this.controller.sendRequest);
    
    /**
     * @swagger
     * /friends/accept:
     *   post:
     *     tags: [Friendship]
     *     summary: Accept friend request
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Friend request accepted
     */
    this.router.post(`/accept`, AuthMiddleware, AuthSecretMiddleware, this.controller.acceptRequest);
    
    /**
     * @swagger
     * /friends/remove/{friendId}:
     *   delete:
     *     tags: [Friendship]
     *     summary: Remove friend
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: friendId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Friend removed
     */
    this.router.delete(`/remove/:friendId`, AuthMiddleware, AuthSecretMiddleware, this.controller.removeFriend);
    
    /**
     * @swagger
     * /friends/list:
     *   get:
     *     tags: [Friendship]
     *     summary: Get friends list
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of friends
     */
    this.router.get(`/list`, AuthMiddleware, AuthSecretMiddleware, this.controller.getFriends);
    
    /**
     * @swagger
     * /friends/requests:
     *   get:
     *     tags: [Friendship]
     *     summary: Get pending friend requests
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of pending requests
     */
    this.router.get(`/requests`, AuthMiddleware, AuthMiddleware, this.controller.getPendingRequests);
  }
}
