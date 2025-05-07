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
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
import { JwtMemberAuthGuard } from 'src/auth/jwt-member-auth.guard';

@UseGuards(JwtMemberAuthGuard)
@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.paymentMethodService.findAll(user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentMethodService.findOne(id, user.userId);
  }

  @Post()
  create(@Body() dto: CreatePaymentMethodDto, @CurrentUser() user: JwtPayload) {
    return this.paymentMethodService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentMethodService.update(id, user.userId, dto);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    return this.paymentMethodService.setDefault(id, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    return this.paymentMethodService.remove(id, user.userId);
  }
}
