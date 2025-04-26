import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { IsInt, Min } from 'class-validator';

export class UpdateCartDto extends PartialType(CreateCartDto) {}
export class UpdateCartItemDto {
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
