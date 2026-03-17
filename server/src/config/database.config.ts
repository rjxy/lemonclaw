import { registerAs } from '@nestjs/config';

/**
 * 数据库配置
 */
export default registerAs('database', () => ({
  type: 'better-sqlite3',
  database: process.env.DB_PATH || 'data/lemonclaw.db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}));
