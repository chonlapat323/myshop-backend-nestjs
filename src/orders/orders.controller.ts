import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from 'types/member/order';
import { UserRole } from 'src/constants/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { JwtMemberAuthGuard } from 'src/auth/jwt-member-auth.guard';
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAdminAuthGuard) // get_orders
  @Get('admin')
  async findAllOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
  ): Promise<{
    data: Order[];
    total: number;
    page: number;
    pageCount: number;
  }> {
    if (user.role_id !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You are not allowed to access admin orders',
      );
    }

    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;

    return this.ordersService.findPaginated({
      page: parsedPage,
      limit: parsedLimit,
      search,
    });
  }

  @UseGuards(JwtAdminAuthGuard) // get_order_by_id
  @Get('admin/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAdminAuthGuard) // update_by_id
  @Patch('admin/:id')
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, data);
  }

  @UseGuards(JwtAdminAuthGuard) // cancel_by_id
  @Patch('admin/:id/cancel')
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.cancelOrder(id, user.userId);
  }

  @UseGuards(JwtMemberAuthGuard) // get_orders
  @Get()
  async findMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const pageNumber = Number(page);
    const pageSize = Number(limit);

    return this.ordersService.findByUserId(user.userId, pageNumber, pageSize);
  }

  @UseGuards(JwtMemberAuthGuard) // get_order_by_id
  @Get(':id')
  async findOneForMember(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.ordersService.findOne(id);
    if (order.userId !== user.userId) {
      throw new ForbiddenException('Access denied.');
    }
    return order;
  }

  @UseGuards(JwtMemberAuthGuard)
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.userId, createOrderDto);
  }

  @UseGuards(JwtMemberAuthGuard) // update_by_id
  @Patch(':id')
  async updateOrderForMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.ordersService.findOne(id);
    if (order.userId !== user.userId) {
      throw new ForbiddenException('Access denied.');
    }
    return this.ordersService.updateOrder(id, data);
  }

  @UseGuards(JwtMemberAuthGuard) // cancel_by_id
  @Patch(':id/cancel')
  async cancelOrderForMember(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.ordersService.findOne(id);
    if (order.userId !== user.userId) {
      throw new ForbiddenException('Access denied.');
    }
    return this.ordersService.cancelOrder(id, user.userId);
  }
}
