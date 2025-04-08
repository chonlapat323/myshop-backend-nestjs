import { Injectable } from '@nestjs/common';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';

@Injectable()
export class SlidesService {
  create(createSlideDto: CreateSlideDto) {
    return 'This action adds a new slide';
  }

  findAll() {
    return `This action returns all slides`;
  }

  findOne(id: number) {
    return `This action returns a #${id} slide`;
  }

  update(id: number, updateSlideDto: UpdateSlideDto) {
    return `This action updates a #${id} slide`;
  }

  remove(id: number) {
    return `This action removes a #${id} slide`;
  }
}
