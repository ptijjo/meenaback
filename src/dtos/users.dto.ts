import { Role, UserStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsStrongPassword, IsBoolean, IsDate, IsIn } from 'class-validator';

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
  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  public secretName?: string;

    @IsOptional()
  @IsString()
  public avatar?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(Role))
  public role?: Role;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(UserStatus))
  public status?: UserStatus;

  @IsOptional()
  @IsBoolean()
  public is2FaEnable?: boolean;

  @IsOptional()
  @IsBoolean()
  public twoFaVerified?: boolean;
}
