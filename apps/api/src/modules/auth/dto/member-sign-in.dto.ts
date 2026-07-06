import { IsOptional, IsString, MinLength } from 'class-validator';

export class MemberSignInDto {
  @IsString()
  identifier!: string;

  @IsString()
  @MinLength(6)
  secret!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
