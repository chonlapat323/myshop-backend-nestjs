import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminsModule } from './admins/admins.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProductsModule } from './products/products.module';
import { CleanupService } from './tasks/cleanup.service';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { OrderItemModule } from './order-item/order-item.module';
import { SlidesModule } from './slides/slides.module';
import { AddressModule } from './address/address.module';
import { PrismaService } from './prisma/prisma.service';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { CartModule } from './cart/cart.module';
import { PrismaModule } from './prisma/prisma.module';
@Module({
  imports: [
    PrismaModule,

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
    PaymentMethodModule,
    CartModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, CleanupService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
