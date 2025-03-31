// src/users/dto/create-user.dto.ts

import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Matches,
  ValidateIf,
  IsBoolean,
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
  note?: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === 'on')
  is_active: boolean;
}
