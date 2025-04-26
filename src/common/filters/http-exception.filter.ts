import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Unique constraint error จาก PostgreSQL
    if (exception instanceof QueryFailedError) {
      const err = exception as any;
      if (
        err?.code === '23505' &&
        err?.detail?.includes('already exists') // optional
      ) {
        return response.status(409).json({
          statusCode: 409,
          message: 'อีเมลนี้ถูกใช้งานแล้ว',
          error: 'Conflict',
        });
      }
    }

    // ถ้าเป็น HttpException ปกติ
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      return response.status(status).json(res);
    }

    // error อื่น ๆ
    console.error('Unexpected error:', exception);
    return response
      .status(500)
      .json(new InternalServerErrorException().getResponse());
  }
}
