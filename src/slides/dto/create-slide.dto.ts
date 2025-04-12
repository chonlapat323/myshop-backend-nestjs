// dto/create-slide.dto.ts
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
export class SlideImageDto {
  @IsOptional()
  @IsNumber()
  id?: number;
  @IsString()
  url: string;
  @IsOptional()
  @IsNumber()
  order_image?: number;
}
export class CreateSlideDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  is_active: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  is_default: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SlideImageDto)
  imageUrls?: SlideImageDto[];
}
