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
} from '@nestjs/common';
import { SlidesService } from './slides.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { generateTempFilename } from 'utils/file.util';

@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Post()
  create(@Body() createSlideDto: CreateSlideDto) {
    return this.slidesService.create(createSlideDto);
  }

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('is_active') isActive?: string,
  ) {
    return this.slidesService.findAll(+page, +limit, isActive);
  }

  @Get('default')
  findDefaultSlide() {
    return this.slidesService.findDefault();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    if (id === null) {
      throw new BadRequestException('Invalid slide id');
    }
    return this.slidesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateSlideDto: UpdateSlideDto) {
    return this.slidesService.update(id, updateSlideDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slidesService.remove(+id);
  }

  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: './public/uploads/temp-uploads',
        filename: (req, file, callback) => {
          callback(null, generateTempFilename(file.originalname));
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
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

  @Delete('/images/:id')
  async removeImage(@Param('id', ParseIntPipe) id: number) {
    return this.slidesService.removeImage(id);
  }
}
