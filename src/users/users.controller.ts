import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
export enum UserRole {
  ADMIN = '1',
  SUPERVISOR = '2',
  MEMBER = '3',
}
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admins')
  findAdmins() {
    return this.usersService.findByRoles([UserRole.ADMIN, UserRole.SUPERVISOR]);
  }
}
