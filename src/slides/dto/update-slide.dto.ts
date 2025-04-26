import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SlideImageDto } from './create-slide.dto';

export class UpdateSlideDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @Type(() => Boolean)
  is_active: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  is_default: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SlideImageDto)
  imageUrls?: SlideImageDto[];
}
