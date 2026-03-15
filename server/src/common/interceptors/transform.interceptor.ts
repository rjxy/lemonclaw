import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

/**
 * 统一响应格式
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * 响应转换拦截器
 * 统一包装所有响应为标准格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // 检查是否跳过转换
    const skipTransform = this.reflector.get<boolean>(
      'skipTransform',
      context.getHandler(),
    );
    if (skipTransform) {
      return next.handle();
    }

    // 获取自定义响应消息
    const message =
      this.reflector.get<string>('responseMessage', context.getHandler()) ??
      '操作成功';

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
