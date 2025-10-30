import { Request, Response, NextFunction } from 'express';
import { FriendshipService } from '../services/friendship.service';
import { RequestWithUser } from '../interfaces/auth.interface';
import Container from 'typedi';

export class FriendshipController {
  public friendshipService = Container.get(FriendshipService);

  public sendRequest = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const friendId = req.body.friendId;

      console.log(`userId:${req.userSecret.ID} et addresseeId:${friendId}`)
      const friendship = await this.friendshipService.sendRequest(req.userSecret.ID, friendId);
      res.status(201).json(friendship);
    } catch (error) {
      next(error);
    }
  };

  public acceptRequest = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const requesterId = req.body.requesterId;
      const friendship = await this.friendshipService.acceptRequest(req.userSecret.ID, requesterId);
      res.status(200).json(friendship);
    } catch (error) {
      next(error);
    }
  };

  public removeFriend = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const friendId = req.params.friendId;
      const message = await this.friendshipService.rejectOrRemove(req.userSecret.ID, friendId);
      res.status(200).json(message);
    } catch (error) {
      next(error);
    }
  };

  public getFriends = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userSecretId = req.userSecret.ID;
      const friends = await this.friendshipService.getFriends(userSecretId);

      res.status(200).json(friends);
    } catch (error) {
      next(error);
    }
  };

  public getPendingRequests = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const requests = await this.friendshipService.getPendingRequests(req.userSecret.ID);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  };
}
