import Container, { Service } from 'typedi';
import { MessageService } from '../services/message.service';
import { RequestWithUser } from '../interfaces/auth.interface';
import { NextFunction,Response } from 'express';
import { UserSecretService } from '../services/userSecret.service';

export class MessageController{
    public messageService = Container.get(MessageService);
    public userSecretService = Container.get(UserSecretService);

    public  createMessage = async (req: RequestWithUser, res: Response, next: NextFunction)=> {
        try {
            const userSecret = await this.userSecretService.findUserSecretByUserId(String(req.user.id));

            const userId = userSecret.ID;
            const { receiverId, content } = req.body;

            const message = await this.messageService.createMessage(userId, receiverId, content);

            res.status(201).json({ status:"Message crée",data:message })
            
        } catch (error) {
            next(error)
        }
    }


    public findAll = async (req: RequestWithUser, res: Response, next: NextFunction)=> {
        try {
            const  conversationId  = String(req.params.id);
            const messages = await this.messageService.getMessage(conversationId);
            res.status(200).json({ status:"Liste des messages", data:messages })
            
        } catch (error) {
            next(error)
        }
    }
}