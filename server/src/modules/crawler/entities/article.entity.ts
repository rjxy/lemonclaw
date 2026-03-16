import { Column, Entity, ManyToOne } from 'typeorm';

import { RssSource } from './rss-source.entity';
import { BaseEntity } from '../../../shared/entities';

/**
 * 资讯文章实体
 */
@Entity('articles')
export class Article extends BaseEntity {
  @Column({ comment: '文章标题' })
  title: string;

  @Column({ unique: true, comment: '原文链接' })
  link: string;

  @Column({ type: 'text', nullable: true, comment: '文章摘要' })
  summary: string;

  @Column({ type: 'text', nullable: true, comment: '原文内容' })
  content: string;

  @Column({ type: 'text', nullable: true, comment: 'AI 总结' })
  aiSummary: string;

  @Column({ name: 'published_at', nullable: true, comment: '发布时间' })
  publishedAt: Date;

  @Column({ default: false, comment: '是否已推送飞书' })
  pushed: boolean;

  @Column({ default: false, comment: '是否已向量化' })
  vectorized: boolean;

  @ManyToOne(() => RssSource, { nullable: true })
  source: RssSource;
}
