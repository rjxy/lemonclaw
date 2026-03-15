import { Module } from '@nestjs/common';

import { AiEngineModule } from '../ai-engine';
import { MonitoringModule } from '../monitoring';
import { SchedulerModule } from '../scheduler';
import { ManagerController } from './manager.controller';

@Module({
  imports: [AiEngineModule, SchedulerModule, MonitoringModule],
  controllers: [ManagerController],
})
export class ManagerModule {}
