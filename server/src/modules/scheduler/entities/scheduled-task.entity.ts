import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../shared/entities';

/**
 * 定时任务实体
 */
@Entity('scheduled_tasks')
export class ScheduledTask extends BaseEntity {
  @Column({ comment: '任务名称' })
  name: string;

  @Column({ comment: 'Cron 表达式' })
  cronExpression: string;

  @Column({ comment: '任务类型: rss_fetch | push_summary | vectorize' })
  taskType: string;

  @Column({ type: 'json', nullable: true, comment: '任务参数' })
  params: Record<string, any>;

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @Column({ name: 'last_run_at', nullable: true, comment: '上次执行时间' })
  lastRunAt: Date;

  @Column({ nullable: true, comment: '创建者（用户ID或系统）' })
  createdBy: string;
}
