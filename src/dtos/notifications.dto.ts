import { NotifiableType, NotificationType } from "@prisma/client"
import { IsBoolean, IsDate, IsIn, IsOptional, IsString } from "class-validator";


export class CreateNotificationDto{

    @IsIn(Object.values(NotificationType))
    @IsString()
    public type: NotificationType;

    @IsIn(Object.values(NotifiableType))
    @IsString()
    public targetType: NotifiableType;
       
}

export class UpdateNotificationDto{

    @IsOptional()
    @IsDate()
    public seenAt?: Date;

    @IsOptional()
    @IsBoolean()
    public read: boolean;
}