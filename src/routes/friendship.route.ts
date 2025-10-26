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
    this.router.post(`/send`, AuthMiddleware, AuthSecretMiddleware, this.controller.sendRequest);
    this.router.post(`/accept`, AuthMiddleware, AuthSecretMiddleware, this.controller.acceptRequest);
    this.router.delete(`/remove/:friendId`, AuthMiddleware, AuthSecretMiddleware, this.controller.removeFriend);
    this.router.get(`/list`, AuthMiddleware, AuthSecretMiddleware, this.controller.getFriends);
    this.router.get(`/requests`, AuthMiddleware, AuthMiddleware, this.controller.getPendingRequests);
  }
}
