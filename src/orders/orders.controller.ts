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
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from 'types/member/order';
import { UserRole } from 'src/constants/user-role.enum';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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

  @Get('admin')
  async findAllOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
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

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.userId, createOrderDto);
  }

  @Patch(':id')
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, data);
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.cancelOrder(id, user.userId);
  }
}
