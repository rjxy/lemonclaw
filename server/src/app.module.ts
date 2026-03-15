import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { HttpExceptionFilter } from './common/filters';
import {
  LoggingInterceptor,
  TransformInterceptor,
} from './common/interceptors';
import {
  aiConfig,
  appConfig,
  databaseConfig,
  feishuConfig,
  vectorConfig,
} from './config';
import { AiEngineModule } from './modules/ai-engine';
import { CrawlerModule } from './modules/crawler';
import { FeishuModule } from './modules/feishu';
import { ManagerModule } from './modules/manager';
import { MonitoringModule } from './modules/monitoring';
import { RagModule } from './modules/rag';
import { SchedulerModule } from './modules/scheduler';
import { DatabaseModule } from './shared/database';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, aiConfig, feishuConfig, vectorConfig],
    }),

    // 数据库模块
    DatabaseModule,

    // 业务模块
    CrawlerModule,
    AiEngineModule,
    RagModule,
    FeishuModule,
    SchedulerModule,
    MonitoringModule,
    ManagerModule,
  ],
  providers: [
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 全局响应转换拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // 全局日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
