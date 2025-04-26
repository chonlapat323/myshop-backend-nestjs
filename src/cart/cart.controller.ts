import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateCartItemDto } from './dto/update-cart.dto';

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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cartService.updateCartItemQuantity(
      id,
      dto.quantity,
      user.userId,
    );
  }

  @Delete('items/:id')
  removeCartItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cartService.removeCartItem(id, user.userId);
  }
}
