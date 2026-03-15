import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * 全局 HTTP 异常过滤器
 * 统一处理所有 HTTP 异常，返回标准格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 记录错误日志
    this.logger.error(`[${status}] ${message}`, (exception as Error)?.stack);

    response.status(status).json({
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
