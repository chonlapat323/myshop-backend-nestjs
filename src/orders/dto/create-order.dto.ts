import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  shippingCost?: number;

  @IsString()
  paymentMethod: string;

  @IsString()
  shippingFullName: string;

  @IsString()
  shippingAddressLine1: string;

  @IsOptional()
  @IsString()
  shippingAddressLine2?: string;

  @IsString()
  shippingCity: string;

  @IsString()
  shippingZip: string;

  @IsString()
  shippingCountry: string;

  @IsString()
  shippingPhone: string;

  @IsString()
  shippingState: string;
}

export class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;
}
