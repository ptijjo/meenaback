import { NotifiableType, NotificationType } from "@prisma/client"
import { IsIn, IsString } from "class-validator";


export class CreateNotificationDto{

    @IsIn(Object.values(NotificationType))
    @IsString()
    public type: NotificationType;

    @IsIn(Object.values(NotifiableType))
    @IsString()
    public targetType: NotifiableType;
       
}