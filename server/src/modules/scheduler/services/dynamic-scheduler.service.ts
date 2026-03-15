import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Repository } from 'typeorm';

import { RssCrawlerService } from '../../crawler/services';
import { ScheduledTask } from '../entities';

/**
 * 动态任务管理服务
 * 支持运行时创建/删除定时任务
 */
@Injectable()
export class DynamicSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(DynamicSchedulerService.name);

  constructor(
    @InjectRepository(ScheduledTask)
    private taskRepo: Repository<ScheduledTask>,
    private schedulerRegistry: SchedulerRegistry,
    private rssCrawlerService: RssCrawlerService,
  ) {}

  /**
   * 模块初始化时加载所有启用的任务
   */
  async onModuleInit() {
    const tasks = await this.taskRepo.find({ where: { enabled: true } });
    for (const task of tasks) {
      this.registerTask(task);
    }
    this.logger.log(`已加载 ${tasks.length} 个定时任务`);
  }

  /**
   * 创建新任务
   */
  async createTask(
    name: string,
    cronExpression: string,
    taskType: string,
    params?: Record<string, any>,
    createdBy?: string,
  ): Promise<ScheduledTask> {
    const task = this.taskRepo.create({
      name,
      cronExpression,
      taskType,
      params,
      createdBy,
    });

    const saved = await this.taskRepo.save(task);
    this.registerTask(saved);

    this.logger.log(`创建任务: ${name} (${cronExpression})`);
    return saved;
  }

  /**
   * 删除任务
   */
  async deleteTask(id: number): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (task) {
      this.unregisterTask(task.id.toString());
      await this.taskRepo.delete(id);
      this.logger.log(`删除任务: ${task.name}`);
    }
  }

  /**
   * 启用/禁用任务
   */
  async toggleTask(id: number, enabled: boolean): Promise<ScheduledTask> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) {
      throw new Error('任务不存在');
    }

    task.enabled = enabled;
    await this.taskRepo.save(task);

    if (enabled) {
      this.registerTask(task);
    } else {
      this.unregisterTask(task.id.toString());
    }

    return task;
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<ScheduledTask[]> {
    return this.taskRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * 注册任务到调度器
   */
  private registerTask(task: ScheduledTask): void {
    const jobName = task.id.toString();

    // 如果已存在则先删除
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
    }

    const job = new CronJob(task.cronExpression, async () => {
      await this.executeTask(task);
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
  }

  /**
   * 从调度器移除任务
   */
  private unregisterTask(jobName: string): void {
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    this.logger.log(`执行任务: ${task.name}`);

    try {
      switch (task.taskType) {
        case 'rss_fetch':
          await this.rssCrawlerService.fetchAllSources();
          break;

        // TODO: 添加更多任务类型
        default:
          this.logger.warn(`未知任务类型: ${task.taskType}`);
      }

      // 更新最后执行时间
      task.lastRunAt = new Date();
      await this.taskRepo.save(task);
    } catch (error) {
      this.logger.error(`任务执行失败: ${task.name}`, error);
    }
  }
}
