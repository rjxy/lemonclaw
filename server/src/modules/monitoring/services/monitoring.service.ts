import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { ApiCallLog } from '../entities';

/**
 * 用量统计结果
 */
export interface UsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgDuration: number;
  byProvider: Record<
    string,
    {
      calls: number;
      tokens: number;
      cost: number;
    }
  >;
}

/**
 * 监控服务
 * Token 用量、费用、调用次数统计
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  // 模型定价（每 1K token，美元）
  private readonly pricing: Record<string, { input: number; output: number }> = {
    'deepseek-chat': { input: 0.0001, output: 0.0002 },
    'qwen-turbo': { input: 0.0003, output: 0.0006 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.005, output: 0.015 },
  };

  constructor(
    @InjectRepository(ApiCallLog)
    private logRepo: Repository<ApiCallLog>,
  ) {}

  /**
   * 记录 API 调用
   */
  async logCall(data: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
    success: boolean;
    errorMessage?: string;
    source?: string;
  }): Promise<ApiCallLog> {
    const cost = this.calculateCost(
      data.model,
      data.inputTokens,
      data.outputTokens,
    );

    const log = this.logRepo.create({
      ...data,
      cost,
    });

    return this.logRepo.save(log);
  }

  /**
   * 获取统计数据
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<UsageStats> {
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const logs = await this.logRepo.find({ where });

    const stats: UsageStats = {
      totalCalls: logs.length,
      successfulCalls: logs.filter((l) => l.success).length,
      failedCalls: logs.filter((l) => !l.success).length,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      avgDuration: 0,
      byProvider: {},
    };

    let totalDuration = 0;

    for (const log of logs) {
      stats.totalInputTokens += log.inputTokens;
      stats.totalOutputTokens += log.outputTokens;
      stats.totalCost += Number(log.cost);
      totalDuration += log.durationMs;

      // 按提供商统计
      if (!stats.byProvider[log.provider]) {
        stats.byProvider[log.provider] = { calls: 0, tokens: 0, cost: 0 };
      }
      stats.byProvider[log.provider].calls++;
      stats.byProvider[log.provider].tokens += log.inputTokens + log.outputTokens;
      stats.byProvider[log.provider].cost += Number(log.cost);
    }

    stats.avgDuration = logs.length > 0 ? totalDuration / logs.length : 0;

    return stats;
  }

  /**
   * 获取今日统计
   */
  async getTodayStats(): Promise<UsageStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getStats(today, tomorrow);
  }

  /**
   * 计算费用
   */
  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const price = this.pricing[model] || { input: 0.001, output: 0.002 };
    return (
      (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output
    );
  }
}
