import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admins.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {
  @IsOptional()
  @IsString()
  id?: string;
}
