import { Module } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { SlidesController } from './slides.controller';
import { Slide } from './entities/slide.entity';
import { SlideImage } from './entities/slide-image.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    TypeOrmModule.forFeature([Slide, SlideImage]), // ✅ ต้องมี
  ],
  controllers: [SlidesController],
  providers: [SlidesService],
})
export class SlidesModule {}
