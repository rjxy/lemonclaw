import { registerAs } from '@nestjs/config';

/**
 * 应用配置
 */
export default registerAs('app', () => ({
  // 服务端口
  port: parseInt(process.env.PORT ?? '3300', 10),
  // 环境
  env: process.env.NODE_ENV || 'development',
}));
