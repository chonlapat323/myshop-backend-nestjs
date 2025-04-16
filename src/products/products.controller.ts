// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
  UploadedFiles,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const skip = (page - 1) * limit;
    return this.productService.findPaginated(+limit, +skip);
  }

  @Get('best-sellers')
  async findBestSellers() {
    return this.productService.findBestSellers();
  }

  @Get('category/:slug')
  getByCategory(
    @Param('slug') slug: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'lowest' | 'highest',
  ) {
    return this.productService.findByCategory(slug, search, sort);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  // ✅ อัปโหลดไฟล์แบบชั่วคราว
  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: './public/temp-uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `temp-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const urls = files.map((file) => `/public/temp-uploads/${file.filename}`);
    return {
      message: 'Uploaded successfully',
      urls,
    };
  }

  @Post()
  create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.productService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @Delete('/images/:id')
  async removeImage(@Param('id', ParseIntPipe) id: number) {
    return this.productService.removeImage(id);
  }
}
