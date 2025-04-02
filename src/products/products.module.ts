import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Tag } from './entities/tag.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Variant, Tag])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
