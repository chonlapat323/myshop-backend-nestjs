import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from 'types/member/order';
import { UserRole } from 'src/constants/user-role.enum';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Req() req): Promise<Order[]> {
    const user = req.user;
    if (user.role === UserRole.ADMIN) {
      return this.ordersService.findAll();
    }

    return this.ordersService.findByUserId(user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Post()
  create(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user?.userId;
    return this.ordersService.create(userId, createOrderDto);
  }

  @Patch(':id')
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, data);
  }

  @Patch(':id/cancel')
  async cancelOrder(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }
}
