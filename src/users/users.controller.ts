import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole } from 'src/constants/user-role.enum';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { editFileName, imageFileFilter } from 'utils';
import { promises as fsPromises } from 'fs';
import { JwtMemberAuthGuard } from 'src/auth/jwt-member-auth.guard';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAdminAuthGuard)
  @Get()
  async findUsers(
    @Query('role') role: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search = '',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    return this.usersService.findUsers({
      role,
      page: pageNumber,
      limit: limitNumber,
      search,
    });
  }

  @UseGuards(JwtMemberAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findUserById(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const member = await this.usersService.findUserById(id);

    if (!member || member.role_id !== UserRole.MEMBER) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('admins')
  findAdmins() {
    return this.usersService.findByRoles([UserRole.ADMIN, UserRole.SUPERVISOR]);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('members')
  findMembers() {
    return this.usersService.findByRoles([UserRole.MEMBER]);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'public', 'uploads', 'users'),
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async create(
    @Req() req: Request,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const rawBody = req.body;
    const avatarUrl = avatar ? `/uploads/users/${avatar.filename}` : undefined;
    const dto = plainToInstance(CreateUserDto, rawBody);
    const errors = await validate(dto);
    if (errors.length > 0) {
      if (avatar?.path) {
        try {
          await fsPromises.unlink(path.resolve(avatar.path));
        } catch (err) {
          console.error('❌ Failed to remove uploaded file:', err);
        }
      }
      throw new BadRequestException(errors);
    }

    try {
      const newAdmin = await this.usersService.create(dto, avatarUrl);
      return {
        message: '✅ Admin created successfully',
        admin: newAdmin,
      };
    } catch (error) {
      if (avatar?.path) {
        try {
          await fsPromises.unlink(path.resolve(avatar.path));
        } catch (err) {
          console.error('❌ Failed to remove uploaded file:', err);
        }
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/update')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'public', 'uploads', 'users'),
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const dto = plainToInstance(UpdateUserDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      if (avatar?.path) {
        try {
          await fsPromises.unlink(path.resolve(avatar.path));
        } catch (err) {
          console.error('❌ Failed to remove uploaded file:', err);
        }
      }
      throw new BadRequestException(errors);
    }

    if (avatar) {
      dto.avatar_url = `/uploads/users/${avatar.filename}`;
    }

    try {
      const updatedUser = await this.usersService.update(
        id,
        dto,
        avatar?.filename,
      );
      return {
        message: '✅ User updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      if (avatar?.path) {
        try {
          await fsPromises.unlink(path.resolve(avatar.path));
        } catch (err) {
          console.error('❌ Failed to remove uploaded file:', err);
        }
      }
      throw error;
    }
  }

  @UseGuards(JwtMemberAuthGuard)
  @Patch('me')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'public', 'uploads', 'users'),
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const dto = plainToInstance(UpdateUserDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      if (avatar?.path) {
        try {
          await fsPromises.unlink(path.resolve(avatar.path));
        } catch (err) {
          console.error('❌ Failed to remove uploaded file:', err);
        }
      }
      throw new BadRequestException(errors);
    }

    if (avatar) {
      dto.avatar_url = `/uploads/users/${avatar.filename}`;
    }

    return this.usersService.update(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
