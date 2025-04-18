import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity'; // Import Entity ของตาราง users
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminsModule } from './admins/admins.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { Variant } from './products/entities/variant.entity';
import { Tag } from './products/entities/tag.entity';
import { CleanupService } from './tasks/cleanup.service';
import { ProductImage } from './products/entities/product-image.entity';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { OrdersModule } from './orders/orders.module';
import { OrderItemModule } from './order-item/order-item.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './order-item/entities/order-item.entity';
import { SlidesModule } from './slides/slides.module';
import { SlideImage } from './slides/entities/slide-image.entity';
import { Slide } from './slides/entities/slide.entity';
import { AddressModule } from './address/address.module';
import { Address } from './address/entities/address.entity';
import { PrismaService } from './prisma/prisma.service';
@Module({
  imports: [
    // 👇 เพิ่มบรรทัดนี้!
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // path จริง
      serveRoot: '/uploads', // URL ที่จะเข้าถึงได้
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // หรือชื่อ container ของ PostgreSQL
      port: 5432,
      username: 'root', // เปลี่ยนเป็น username ของคุณ
      password: 'admin', // เปลี่ยนเป็น password ของคุณ
      database: 'ecommerce-db', // เปลี่ยนเป็นชื่อ database ของคุณ
      entities: [
        User,
        Product,
        Variant,
        Tag,
        ProductImage,
        Category,
        Order,
        OrderItem,
        Slide,
        SlideImage,
        Address,
      ], // โหลด entity ที่เกี่ยวข้อง
      synchronize: true, // ปิดการ sync เพราะตารางมีอยู่แล้ว
      dropSchema: false, // ✅ เพิ่มบรรทัดนี้
    }),
    ConfigModule.forRoot({
      isGlobal: true, // ทำให้ ConfigService สามารถใช้งานได้ในทุก Module
      envFilePath: '.env', // ระบุ path ไปยังไฟล์ .env ของคุณ
    }),
    UsersModule,
    AuthModule,
    AdminsModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    OrderItemModule,
    SlidesModule,
    AddressModule,
  ],
  controllers: [AppController],
  providers: [AppService, CleanupService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
