import { Controller, Get, Query } from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators';
import { MonitoringService } from './services';

@Controller('monitoring')
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  @Get('stats')
  @ResponseMessage('获取统计数据成功')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate && endDate) {
      return this.monitoringService.getStats(
        new Date(startDate),
        new Date(endDate),
      );
    }
    return this.monitoringService.getStats();
  }

  @Get('today')
  @ResponseMessage('获取今日统计成功')
  async getTodayStats() {
    return this.monitoringService.getTodayStats();
  }
}
