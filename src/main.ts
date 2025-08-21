import { ArgumentsHost, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json()); // ใส่ให้แน่ใจว่ารับ JSON ได้
  app.use(express.urlencoded({ extended: true })); // สำหรับ form-urlencoded (optional)
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ตัด property ที่ไม่ได้อยู่ใน DTO ออก
      forbidNonWhitelisted: true, // ถ้าเจอ prop แปลก → error
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
    credentials: true, // อนุญาตให้ส่ง cookies หรือ headers อื่น ๆ
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
