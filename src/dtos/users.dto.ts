import { Type } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsStrongPassword, IsBoolean, IsDate } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  public email: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un symbole et au moins 8 caractères.',
    },
  )
  public password?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(32)
  public secretName: string;


  @IsOptional()
  @IsString()
  public verificationToken?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  public verificationExpiresAt?: Date;
}

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(32)
  public secretName: string;
}
