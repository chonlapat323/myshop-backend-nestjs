import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: path.join(
          __dirname,
          '..',
          '..',
          'public',
          'uploads',
          'categories',
        ),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `image-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imagePath = file
      ? `/public/uploads/categories/${file.filename}`
      : undefined;

    try {
      const newCategory = await this.categoriesService.create(
        createCategoryDto,
        imagePath,
      );
      return {
        message: '✅ Category created successfully',
        category: newCategory,
      };
    } catch (error) {
      if (file?.path) {
        const fullPath = path.resolve(file.path);
        fs.unlink(fullPath, (err) => {
          if (err) console.error('❌ Failed to remove uploaded file:', err);
        });
      }
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('paginated')
  async findPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    return this.categoriesService.findPaginated(limit, skip);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  // PATCH หรือ POST method แล้วแต่คุณเลือกใช้ (ในตัวอย่างใช้ POST)
  @Post(':id/update') // หรือใช้ @Post(':id/update') ก็ได้
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './public/uploads/categories',
        filename: (req, file, cb) => {
          const uniqueSuffix = `image-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagePath = file ? `/uploads/categories/${file.filename}` : undefined;

    try {
      const updatedCategory = await this.categoriesService.update(
        +id,
        body,
        imagePath,
      );
      return {
        message: '✅ Category updated successfully',
        category: updatedCategory,
      };
    } catch (error) {
      // ถ้าอัปโหลดภาพแล้วเกิด error ต้องลบภาพทิ้ง
      if (file?.path) {
        const fullPath = path.resolve(file.path);
        fs.unlink(fullPath, (err) => {
          if (err) console.error('❌ Failed to remove uploaded file:', err);
        });
      }
      throw error;
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
