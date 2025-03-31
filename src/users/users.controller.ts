import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './create-user-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname } from 'path';
import * as path from 'path';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { raw } from 'express';
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

  @UseGuards(JwtAuthGuard)
  @Get('members')
  findMembers() {
    return this.usersService.findByRoles([UserRole.MEMBER]);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async create(
    @Req() req: Request, // 👈 รับ request ทั้งก้อนแทน @Body()
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const rawBody = req.body;
    console.log(rawBody);
    const avatarUrl = avatar ? `/uploads/${avatar.filename}` : undefined;
    // ✅ แปลงจาก plain object → DTO
    const dto = plainToInstance(CreateUserDto, rawBody);
    // ✅ ตรวจสอบ DTO
    const errors = await validate(dto);
    if (errors.length > 0) {
      // ❌ ลบรูปถ้า validate ไม่ผ่าน
      if (avatar?.path) {
        const fullPath = path.resolve(avatar.path);
        fs.unlink(fullPath, (err) => {
          if (err) console.error('❌ Failed to remove uploaded file:', err);
        });
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
        const fullPath = path.resolve(avatar.path);
        fs.unlink(fullPath, (err) => {
          if (err) console.error('❌ Failed to remove uploaded file:', err);
        });
      }
      throw error;
    }
  }
}
