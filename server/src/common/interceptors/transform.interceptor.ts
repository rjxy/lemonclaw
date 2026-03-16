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
 * 成功响应包装函数
 */
export function success<T>(data: T, message = '操作成功'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 失败响应包装函数
 */
export function fail<T = null>(
  message: string,
  code = -1,
  data: T = null as T,
): ApiResponse<T> {
  return {
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}
