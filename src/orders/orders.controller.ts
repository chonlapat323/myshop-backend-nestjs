import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { AuthGuard } from '@nestjs/passport';
import { Order } from 'types/member/order';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user?.userId;
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  async findAll(@Req() req): Promise<Order[]> {
    const user = req.user;

    // ถ้าเป็น admin ให้ดูทั้งหมด
    // if (user.role === 'admin') {
    //   return this.ordersService.findAll();
    // }

    // ถ้าเป็น member ให้ดูแค่ของตัวเอง
    return this.ordersService.findByUserId(user.id);
  }

  // @Get(':id')
  // @UseGuards(AuthGuard('jwt'))
  // async findOne(@Req() req, @Param('id') id: number) {
  //   const order = await this.ordersService.findOne(+id);

  //   // ✅ จำกัดสิทธิ์
  //   if (req.user.role !== 'admin' && req.user.id !== order.user.id) {
  //     throw new ForbiddenException('You cannot access this order');
  //   }

  //   return order;
  // }

  // @Patch(':id')
  // update(
  //   @Req() req,
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: UpdateOrderDto,
  // ) {
  //   // ตัวอย่าง: ให้เฉพาะ admin เปลี่ยนสถานะ
  //   if (req.user.role !== 'admin') {
  //     throw new ForbiddenException('Only admins can update orders');
  //   }

  //   return this.ordersService.update(id, dto);
  // }

  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.ordersService.remove(id);
  // }
}
