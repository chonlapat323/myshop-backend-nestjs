import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './admins.dto';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

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
  async createAdmin(
    @UploadedFile() avatar: Express.Multer.File | undefined, // ✅ เผื่อกรณีไม่มี avatar
    @Body() body: CreateAdminDto,
  ) {
    const avatarUrl = avatar ? `/uploads/${avatar.filename}` : undefined;

    const newAdmin = await this.adminsService.create(body, avatarUrl);

    return {
      message: '✅ Admin created successfully',
      admin: newAdmin,
    };
  }
}
