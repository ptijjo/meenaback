import { IsBoolean, IsEmail, IsString } from "class-validator";



export class CreateLoginAttemps{
    @IsEmail()
    public emailName: string;

    @IsBoolean()
    public succes: boolean;

    @IsString()
    public ipAddress: string;
}