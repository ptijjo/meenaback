import { Router } from 'express';
import { FriendshipController } from '../controllers/friendship.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class FriendshipRoute {
  public path = '/friends';
  public router = Router();
  public controller = new FriendshipController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/send`, AuthMiddleware, this.controller.sendRequest);
    this.router.post(`${this.path}/accept`, AuthMiddleware, this.controller.acceptRequest);
    this.router.delete(`${this.path}/remove/:friendId`, AuthMiddleware, this.controller.removeFriend);
    this.router.get(`${this.path}/list`, AuthMiddleware, this.controller.getFriends);
    this.router.get(`${this.path}/requests`, AuthMiddleware, this.controller.getPendingRequests);
  }
}
