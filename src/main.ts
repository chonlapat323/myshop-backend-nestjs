import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ตัด property ที่ไม่ได้อยู่ใน DTO ออก
      forbidNonWhitelisted: true, // ถ้าเจอ prop แปลก → error
      transform: true, // แปลง type ให้ตรงกับ DTO เช่น string -> number
    }),
  );
  app.use('/uploads', express.static(join(__dirname, '..', 'public/uploads')));
  app.enableCors({
    origin: 'http://localhost:3000', // อนุญาตเฉพาะ Next.js ที่รันบนพอร์ต 3001
    credentials: true, // อนุญาตให้ส่ง cookies หรือ headers อื่น ๆ
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
