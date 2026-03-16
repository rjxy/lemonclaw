import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../shared/entities';

/**
 * API 调用记录实体
 */
@Entity('api_call_logs')
export class ApiCallLog extends BaseEntity {
  @Column({ comment: '模型提供商' })
  provider: string;

  @Column({ comment: '模型名称' })
  model: string;

  @Column({ name: 'input_tokens', default: 0, comment: '输入 Token 数' })
  inputTokens: number;

  @Column({ name: 'output_tokens', default: 0, comment: '输出 Token 数' })
  outputTokens: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    default: 0,
    comment: '费用（美元）',
  })
  cost: number;

  @Column({ name: 'duration_ms', default: 0, comment: '响应耗时（毫秒）' })
  durationMs: number;

  @Column({ default: true, comment: '是否成功' })
  success: boolean;

  @Column({ nullable: true, comment: '错误信息' })
  errorMessage: string;

  @Column({ nullable: true, comment: '调用来源模块' })
  source: string;
}
