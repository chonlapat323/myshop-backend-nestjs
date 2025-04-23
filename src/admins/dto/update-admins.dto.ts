import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admins.dto';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
