import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiCallLog } from './entities';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './services';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ApiCallLog])],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
