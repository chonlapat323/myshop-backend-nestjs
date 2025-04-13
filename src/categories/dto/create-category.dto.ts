import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  link?: string; // ✅ เพิ่ม field นี้

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active: boolean;
}
