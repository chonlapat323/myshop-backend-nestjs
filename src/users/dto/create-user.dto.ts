import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Matches,
  ValidateIf,
  IsBoolean,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  phone_number?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  note?: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === 'on')
  is_active: boolean;
}
