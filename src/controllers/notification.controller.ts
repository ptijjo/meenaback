import Container from "typedi";
import { NotificationService } from '../services/notification.service';
import { RequestWithUser } from "../interfaces/auth.interface";
import { NextFunction,Response } from "express";




export class NotificationController{
    private notificationService = Container.get(NotificationService)

    public getNotification = async(req: RequestWithUser, res: Response, next: NextFunction)=>{
        try {
            const userSecretId = req.userSecret.ID;

            const notifications = await this.notificationService.getNewsNotifications(userSecretId);

            res.status(200).json({message:"liste des messages",data:notifications})
        
    } catch (error) {
        next(error)
    }
    }
}