import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  role_id: number;

  @IsOptional()
  @IsString()
  confirm_password?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === 'on')
  is_active?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
