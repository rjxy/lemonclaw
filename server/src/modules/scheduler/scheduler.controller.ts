import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators';
import { TimeParser } from '../../../common/utils';
import { DynamicSchedulerService } from './services';

@Controller('scheduler')
export class SchedulerController {
  constructor(private dynamicSchedulerService: DynamicSchedulerService) {}

  @Get('tasks')
  @ResponseMessage('获取任务列表成功')
  async getTasks() {
    return this.dynamicSchedulerService.getAllTasks();
  }

  @Post('tasks')
  @ResponseMessage('创建任务成功')
  async createTask(
    @Body()
    body: {
      name: string;
      cronExpression?: string;
      naturalTime?: string; // 支持自然语言时间
      taskType: string;
      params?: Record<string, any>;
    },
  ) {
    // 如果提供自然语言时间，则解析为 cron 表达式
    let cron = body.cronExpression;
    if (!cron && body.naturalTime) {
      cron = TimeParser.parseToCron(body.naturalTime) ?? undefined;
      if (!cron) {
        throw new Error('无法解析时间表达式');
      }
    }

    if (!cron) {
      throw new Error('请提供 cronExpression 或 naturalTime');
    }

    return this.dynamicSchedulerService.createTask(
      body.name,
      cron,
      body.taskType,
      body.params,
    );
  }

  @Delete('tasks/:id')
  @ResponseMessage('删除任务成功')
  async deleteTask(@Param('id') id: number) {
    await this.dynamicSchedulerService.deleteTask(id);
    return { id };
  }

  @Put('tasks/:id/toggle')
  @ResponseMessage('切换任务状态成功')
  async toggleTask(@Param('id') id: number, @Body('enabled') enabled: boolean) {
    return this.dynamicSchedulerService.toggleTask(id, enabled);
  }
}
