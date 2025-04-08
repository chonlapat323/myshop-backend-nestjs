import { Module } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { SlidesController } from './slides.controller';

@Module({
  controllers: [SlidesController],
  providers: [SlidesService],
})
export class SlidesModule {}
