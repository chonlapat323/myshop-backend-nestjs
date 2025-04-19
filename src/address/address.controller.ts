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
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/auth/type/jwt-payload.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
    return this.addressService.create(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.addressService.findAll(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    return this.addressService.findOne(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(id, user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/default')
  setDefault(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    return this.addressService.setDefault(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    return this.addressService.remove(id, user.userId);
  }
}
