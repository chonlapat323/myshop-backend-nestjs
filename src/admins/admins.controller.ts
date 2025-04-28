import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admins.dto';
import { UpdateAdminDto } from './dto/update-admins.dto';
import { Delete, Param, NotFoundException } from '@nestjs/common'; // ⬅️ เพิ่มตรง import ด้านบน
import * as fs from 'fs';
import * as path from 'path';
import { editFileName, imageFileFilter } from '../common/utils/file-upload';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import { users as User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const admin = await this.adminsService.findById(id);

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'public', 'uploads', 'users'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async createAdmin(
    @UploadedFile() avatar: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    const rawBody = req.body;
    const avatarUrl = avatar ? `/uploads/users/${avatar.filename}` : undefined;

    if (typeof rawBody.hashed_password !== 'string') {
      rawBody.hashed_password = String(rawBody.hashed_password ?? '');
    }

    const dto = plainToInstance(CreateAdminDto, rawBody);
    const errors = await validate(dto);
    if (errors.length > 0) {
      if (avatar?.path) {
        const fullPath = path.resolve(avatar.path);
        fs.unlink(fullPath, (err) => {
          if (err) console.error('❌ Failed to remove uploaded file:', err);
        });
      }
      throw new BadRequestException(errors);
    }

    try {
      const newAdmin = await this.adminsService.create(dto, avatarUrl);
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

  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'public', 'uploads', 'users'),
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  @Post(':id/update')
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const rawBody = req.body;
    const dto = plainToInstance(UpdateAdminDto, rawBody);

    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    if (file) {
      dto.avatar_url = `/uploads/users/${file.filename}`;
      const admin = await this.findOne(id);
      const oldPath = admin.avatar_url
        ? path.join(process.cwd(), admin.avatar_url)
        : null;
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    try {
      return this.adminsService.update(id, dto, file?.filename);
    } catch (error) {
      if (file?.path) {
        const fullPath = path.resolve(file.path);
        await fs.promises.unlink(fullPath).catch((err) => {
          console.error('❌ Failed to remove uploaded file:', err);
        });
      }
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.remove(id);
  }
}
