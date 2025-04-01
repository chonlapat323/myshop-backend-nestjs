// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsNumber()
  stock: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @IsNumber()
  stock: number;

  @IsString()
  sku: string;

  @IsString()
  brand: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
