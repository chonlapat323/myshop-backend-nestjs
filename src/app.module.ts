import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity'; // Import Entity ของตาราง users
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminsModule } from './admins/admins.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // หรือชื่อ container ของ PostgreSQL
      port: 5432,
      username: 'root', // เปลี่ยนเป็น username ของคุณ
      password: 'admin', // เปลี่ยนเป็น password ของคุณ
      database: 'ecommerce-db', // เปลี่ยนเป็นชื่อ database ของคุณ
      entities: [User], // โหลด entity ที่เกี่ยวข้อง
      synchronize: true, // ปิดการ sync เพราะตารางมีอยู่แล้ว
    }),
    ConfigModule.forRoot({
      isGlobal: true, // ทำให้ ConfigService สามารถใช้งานได้ในทุก Module
      envFilePath: '.env', // ระบุ path ไปยังไฟล์ .env ของคุณ
    }),
    UsersModule,
    AuthModule,
    AdminsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
