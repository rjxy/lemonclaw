import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrawlerModule } from '../crawler';
import { ScheduledTask } from './entities';
import { SchedulerController } from './scheduler.controller';
import { DynamicSchedulerService } from './services';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ScheduledTask]),
    CrawlerModule,
  ],
  controllers: [SchedulerController],
  providers: [DynamicSchedulerService],
  exports: [DynamicSchedulerService],
})
export class SchedulerModule {}
