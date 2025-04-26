import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('count')
  getItemCount(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCartItemCount(user.userId);
  }

  @Post('items')
  addItemToCart(@Body() dto: AddToCartDto, @CurrentUser() user: JwtPayload) {
    return this.cartService.addItemToCart(
      user.userId,
      dto.productId,
      dto.quantity,
    );
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCartByUserId(user.userId);
  }

  @Patch('items/:id')
  updateCartItemQuantity(
    @Param('id') id: number,
    @Body('quantity') quantity: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cartService.updateCartItemQuantity(id, quantity, user.userId);
  }

  @Delete('items/:id')
  removeCartItem(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    return this.cartService.removeCartItem(id, user.userId);
  }
}
