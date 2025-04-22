import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export enum OrderStatusEnum {
  pending = 'pending',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled',
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  shippingFullName?: string;

  @IsOptional()
  @IsString()
  shippingAddressLine1?: string;

  @IsOptional()
  @IsString()
  shippingAddressLine2?: string;

  @IsOptional()
  @IsString()
  shippingCity?: string;

  @IsOptional()
  @IsString()
  shippingZip?: string;

  @IsOptional()
  @IsString()
  shippingCountry?: string;

  @IsOptional()
  @IsNumber()
  shippingCost?: number;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsEnum(OrderStatus)
  order_status: OrderStatus;

  @IsOptional()
  @IsString()
  tracking_number?: string;
}
