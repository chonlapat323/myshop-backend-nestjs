import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminsService } from './admins.service';
import { CreateAdminDto, UpdateAdminDto } from './admins.dto';
import { Delete, Param, NotFoundException } from '@nestjs/common'; // ⬅️ เพิ่มตรง import ด้านบน
import * as fs from 'fs';
import * as path from 'path';
import { User } from 'src/users/user.entity';
import { editFileName, imageFileFilter } from '../common/utils/file-upload';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
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
        destination: path.join(__dirname, '..', '..', 'uploads', 'users'),
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
    @Req() req: Request, // 👈 รับ request ทั้งก้อนแทน @Body()
  ) {
    const rawBody = req.body;
    const avatarUrl = avatar ? `/uploads/users/${avatar.filename}` : undefined;

    // ✅ ป้องกัน hashed_password ไม่เป็น string
    if (typeof rawBody.hashed_password !== 'string') {
      rawBody.hashed_password = String(rawBody.hashed_password ?? '');
    }

    // ✅ แปลงจาก plain object → DTO
    const dto = plainToInstance(CreateAdminDto, rawBody);
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
        destination: path.join(__dirname, '..', '..', 'uploads', 'users'),
        filename: editFileName, // ✅ ใช้ฟังก์ชัน rename ของคุณ
      }),
      fileFilter: imageFileFilter, // ✅ filter เฉพาะ .jpg .jpeg .png .gif
    }),
  )
  @Post(':id/update')
  async updateAdmin(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const rawBody = req.body;
    const dto = plainToInstance(UpdateAdminDto, rawBody);

    // ✅ ตรวจสอบความถูกต้องด้วย class-validator
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // ✅ แนบไฟล์ถ้ามี
    if (file) {
      dto.avatar_url = `/uploads/users/${file.filename}`;
      // ✅ ลบรูปเก่า
      const admin = await this.findOne(parseInt(req.params.id));
      const oldPath = admin.avatar_url
        ? path.join(__dirname, '..', '..', admin.avatar_url)
        : null;
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    try {
      return this.adminsService.update(parseInt(req.params.id), dto);
    } catch (error) {
      // ❌ ถ้า save admin ไม่สำเร็จ → ลบไฟล์ออก
      if (file?.path) {
        const fullPath = path.resolve(file.path);
        fs.unlink(fullPath, (err) => {
          if (err) console.error('❌ Failed to remove uploaded file:', err);
        });
      }

      // ✅ ส่ง error กลับ
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    if (!id) {
      throw new NotFoundException('Invalid ID');
    }
    return this.adminsService.remove(id);
  }
}
