import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrawlerController } from './crawler.controller';
import { Article, RssSource } from './entities';
import { RssCrawlerService } from './services';
import { AiEngineModule } from '../ai-engine';
// TODO: youtube-transcript 包存在 ESM 兼容性问题，暂时禁用
// import { YoutubeCrawlerService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([RssSource, Article]), AiEngineModule],
  controllers: [CrawlerController],
  providers: [RssCrawlerService],
  exports: [RssCrawlerService, TypeOrmModule],
})
export class CrawlerModule {}
