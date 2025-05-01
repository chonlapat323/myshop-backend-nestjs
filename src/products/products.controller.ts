import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  Query,
  UploadedFiles,
  BadRequestException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { editFileName, imageFileFilter } from 'utils';
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search: string = '',
  ) {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;

    return this.productService.findPaginated({
      page: parsedPage,
      limit: parsedLimit,
      search,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('paginated')
  async findPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('category_id') category_id?: string,
    @Query('is_active') is_active?: string,
  ) {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;

    return this.productService.findPaginated({
      page: parsedPage,
      limit: parsedLimit,
      search,
      category_id,
      is_active,
    });
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

  @UseGuards(JwtAuthGuard)
  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: path.join(
          process.cwd(),
          'public',
          'uploads',
          'temp-uploads',
        ),
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const urls = files.map((file) => `/uploads/temp-uploads/${file.filename}`);
    return {
      message: 'Uploaded successfully',
      urls,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/images/:id')
  async removeImage(@Param('id', ParseIntPipe) id: number) {
    return this.productService.removeImage(id);
  }
}
