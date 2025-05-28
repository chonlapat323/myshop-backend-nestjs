import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { UpdateCategoryOrderDto } from './dto/update-category-order.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('active')
  getActiveCategories() {
    return this.categoriesService.findActive();
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('all')
  getAllCategories() {
    return this.categoriesService.findAllIncludingDeleted();
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('paginated')
  async findPaginated(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('isActive') isActive?: string,
  ) {
    return this.categoriesService.findPaginated({
      page: Number(page),
      limit: Number(limit),
      search,
      isActive,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: path.join(
          process.cwd(),
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
    const imagePath = file ? `/uploads/categories/${file.filename}` : undefined;

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

  @UseGuards(JwtAdminAuthGuard)
  @Post(':id/update')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: path.join(
          process.cwd(),
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
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagePath = file
      ? `/uploads/categories/${file.filename}` // ✅ path สำหรับ frontend
      : undefined;

    try {
      const updatedCategory = await this.categoriesService.update(
        id,
        body,
        imagePath,
      );
      return {
        message: '✅ Category updated successfully',
        category: updatedCategory,
      };
    } catch (error) {
      if (file?.path && fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path).catch((err) => {
          console.error('❌ Failed to remove uploaded file:', err);
        });
      }
      throw error;
    }
  }

  @Patch('admin/order')
  @UseGuards(JwtAdminAuthGuard)
  updateCategoryOrder(@Body() dto: UpdateCategoryOrderDto) {
    return this.categoriesService.updateOrder(dto.data);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
