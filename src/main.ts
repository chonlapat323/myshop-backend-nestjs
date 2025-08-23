import { ArgumentsHost, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json()); // ใส่ให้แน่ใจว่ารับ JSON ได้
  app.use(express.urlencoded({ extended: true })); // สำหรับ form-urlencoded (optional)
  app.use(cookieParser());

  // ✅ เพิ่ม Static File Serving สำหรับรูปภาพ
  const uploadsPath = join(process.cwd(), 'public', 'uploads');
  const publicPath = join(process.cwd(), 'public');

  console.log('📁 Uploads path:', uploadsPath);
  console.log('📁 Public path:', publicPath);

  app.use('/uploads', express.static(uploadsPath));
  app.use('/public', express.static(publicPath));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // ตัด property ที่ไม่ได้อยู่ใน DTO ออก
      forbidNonWhitelisted: false, // ถ้าเจอ prop แปลก → error
      transform: true, // แปลง type ให้ตรงกับ DTO เช่น string -> number
    }),
  );
  app.useGlobalFilters(
    {
      catch(exception: any, host: ArgumentsHost) {
        console.error('🔥 Caught exception:', exception);
        throw exception;
      },
    },
    new HttpExceptionFilter(),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
