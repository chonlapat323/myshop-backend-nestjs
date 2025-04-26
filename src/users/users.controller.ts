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
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findUsers(@Query('role') role: string, @Query('page') page: string) {
    const pageNumber = parseInt(page) || 1;
    return this.usersService.findUsers({ role, page: pageNumber });
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findUserById(user.userId);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const member = await this.usersService.findUserById(id);

    if (!member || member.role_id !== UserRole.ADMIN) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  @Get('admins')
  findAdmins() {
    return this.usersService.findByRoles([UserRole.ADMIN, UserRole.SUPERVISOR]);
  }

  @Get('members')
  findMembers() {
    return this.usersService.findByRoles([UserRole.MEMBER]);
  }

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

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
