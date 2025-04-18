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
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/auth/type/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly service: PaymentMethodService) {}

  @Post()
  create(@Body() dto: CreatePaymentMethodDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.userId, dto);
  }

  @Patch(':id/default')
  @UseGuards(JwtAuthGuard)
  setDefault(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.setDefault(id, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.userId);
  }
}
