import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SlidesService } from './slides.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { generateTempFilename } from 'utils/file.util';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { imageFileFilter } from 'utils';

@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('search') search = '',
    @Query('is_active') isActive?: string,
  ) {
    return this.slidesService.findAll({
      page,
      limit,
      search,
      isActive,
    });
  }

  @Get('default')
  findDefaultSlide() {
    return this.slidesService.findDefault();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.slidesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createSlideDto: CreateSlideDto) {
    return this.slidesService.create(createSlideDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSlideDto: UpdateSlideDto,
  ) {
    return this.slidesService.update(id, updateSlideDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.slidesService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: './public/uploads/temp-uploads',
        filename: (req, file, callback) => {
          callback(null, generateTempFilename(file.originalname));
        },
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
  @Delete('/images/:id')
  async removeImage(@Param('id', ParseIntPipe) id: number) {
    return this.slidesService.removeImage(id);
  }
}
