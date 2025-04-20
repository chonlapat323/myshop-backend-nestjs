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
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/auth/type/jwt-payload.interface';
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

  // @Post()
  // create(@Body() createCartDto: CreateCartDto) {
  //   return this.cartService.create(createCartDto);
  // }

  // @Get()
  // findAll() {
  //   return this.cartService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.cartService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
  //   return this.cartService.update(+id, updateCartDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.cartService.remove(+id);
  // }
}
