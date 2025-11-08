import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";




export class CreateGroupDto{
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(32)
    public name: string;


    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(200)
    public description: string;
}

export class UpdateGroupDto{
    @IsOptional()
        @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(32)
    public name?: string;

@IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(200)
    public description?: string;
}