import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../shared/entities';

/**
 * RSS 源实体
 */
@Entity('rss_sources')
export class RssSource extends BaseEntity {
  @Column({ comment: 'RSS 源名称' })
  name: string;

  @Column({ comment: 'RSS 订阅地址' })
  url: string;

  @Column({ comment: '分类', nullable: true })
  category: string;

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @Column({ name: 'fetch_interval', default: 30, comment: '抓取间隔（分钟）' })
  fetchInterval: number;

  @Column({ name: 'last_fetched_at', nullable: true, comment: '最后抓取时间' })
  lastFetchedAt: Date;
}
