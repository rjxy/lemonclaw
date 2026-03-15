import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrawlerController } from './crawler.controller';
import { Article, RssSource } from './entities';
import { RssCrawlerService, YoutubeCrawlerService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([RssSource, Article])],
  controllers: [CrawlerController],
  providers: [RssCrawlerService, YoutubeCrawlerService],
  exports: [RssCrawlerService, YoutubeCrawlerService, TypeOrmModule],
})
export class CrawlerModule {}
