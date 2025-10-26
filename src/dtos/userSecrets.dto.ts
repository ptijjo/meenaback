import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateUserSecretDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  public nameSecret?: string;

  @IsOptional()
  @IsString()
  public avatarSecret?: string;
}
