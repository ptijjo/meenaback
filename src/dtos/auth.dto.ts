import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  public email: string;

  @IsOptional()
  @IsString()
  public password?: string;

  @IsOptional()
  @IsString()
  public googleId?: string;
}
