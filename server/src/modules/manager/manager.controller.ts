import { Controller, Get } from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators';
import { ModelFactory, ModelProvider } from '../../ai-engine/services';
import { MonitoringService } from '../../monitoring/services';
import { DynamicSchedulerService } from '../../scheduler/services';

/**
 * 管理后台控制器
 * 统一管理入口
 */
@Controller('manager')
export class ManagerController {
  constructor(
    private modelFactory: ModelFactory,
    private schedulerService: DynamicSchedulerService,
    private monitoringService: MonitoringService,
  ) {}

  /**
   * 获取系统概览
   */
  @Get('overview')
  @ResponseMessage('获取系统概览成功')
  async getOverview() {
    const [tasks, stats] = await Promise.all([
      this.schedulerService.getAllTasks(),
      this.monitoringService.getStats(),
    ]);

    return {
      currentProvider: this.modelFactory.getCurrentProvider(),
      activeTasks: tasks.filter((t) => t.enabled).length,
      totalTasks: tasks.length,
      stats,
    };
  }

  /**
   * 获取支持的模型列表
   */
  @Get('models')
  @ResponseMessage('获取模型列表成功')
  getAvailableModels() {
    const models: { provider: ModelProvider; name: string; description: string }[] = [
      { provider: 'deepseek', name: 'DeepSeek', description: '高性价比国产模型' },
      { provider: 'qwen', name: '通义千问', description: '阿里云大模型' },
      { provider: 'openai', name: 'OpenAI GPT', description: 'GPT 系列模型' },
      { provider: 'local', name: '本地模型', description: 'Ollama 本地部署' },
    ];

    return {
      models,
      current: this.modelFactory.getCurrentProvider(),
    };
  }
}
