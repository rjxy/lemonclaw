import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRssSourceDto, UpdateRssSourceDto } from './dto';
import { Article, RssSource } from './entities';
import { RssCrawlerService } from './services';
import { ResponseMessage } from '../../common/decorators';

/**
 * 资讯抓取控制器
 */
@Controller('crawler')
export class CrawlerController {
  constructor(
    @InjectRepository(RssSource)
    private rssSourceRepo: Repository<RssSource>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    private rssCrawlerService: RssCrawlerService,
  ) {}

  // ============ RSS 源管理 ============

  @Get('sources')
  @ResponseMessage('获取 RSS 源列表成功')
  async getSources() {
    return this.rssSourceRepo.find({ order: { createdAt: 'DESC' } });
  }

  @Post('sources')
  @ResponseMessage('创建 RSS 源成功')
  async createSource(@Body() dto: CreateRssSourceDto) {
    const source = this.rssSourceRepo.create(dto);
    return this.rssSourceRepo.save(source);
  }

  @Put('sources/:id')
  @ResponseMessage('更新 RSS 源成功')
  async updateSource(@Param('id') id: number, @Body() dto: UpdateRssSourceDto) {
    await this.rssSourceRepo.update(id, dto);
    return this.rssSourceRepo.findOne({ where: { id } });
  }

  @Delete('sources/:id')
  @ResponseMessage('删除 RSS 源成功')
  async deleteSource(@Param('id') id: number) {
    await this.rssSourceRepo.delete(id);
    return { id };
  }

  // ============ 文章管理 ============

  @Get('articles')
  @ResponseMessage('获取文章列表成功')
  async getArticles() {
    return this.articleRepo.find({
      order: { publishedAt: 'DESC' },
      take: 50,
      relations: ['source'],
    });
  }

  @Post('fetch')
  @ResponseMessage('手动抓取完成')
  async manualFetch() {
    const articles = await this.rssCrawlerService.fetchAllSources();
    return { count: articles.length };
  }

  @Post('fetch/:sourceId')
  @ResponseMessage('抓取指定源完成')
  async fetchSource(@Param('sourceId') sourceId: number) {
    const source = await this.rssSourceRepo.findOne({
      where: { id: sourceId },
    });
    if (!source) {
      return { count: 0 };
    }
    const articles = await this.rssCrawlerService.fetchSource(source);
    return { count: articles.length };
  }

  // ============ 初始化与测试 ============

  @Post('init-sources')
  @ResponseMessage('从配置初始化 RSS 源完成')
  async initSources() {
    const sources = await this.rssCrawlerService.initSourcesFromConfig();
    return { count: sources.length, sources: sources.map((s) => s.name) };
  }

  @Post('test-fetch/:sourceId')
  @ResponseMessage('测试抓取完成')
  async testFetch(@Param('sourceId') sourceId: number) {
    // 限制只抓取 3 篇文章，输出到测试文档
    const result = await this.rssCrawlerService.testFetch(sourceId, 3);
    return {
      count: result.articles.length,
      outputPath: result.outputPath,
      articles: result.articles.map((a) => ({
        title: a.title,
        link: a.link,
      })),
    };
  }

  // ============ 数据清理 ============

  @Post('articles/clear')
  @ResponseMessage('清空所有文章成功')
  async clearAllArticles() {
    const count = await this.articleRepo.count();
    await this.articleRepo.clear();
    return { deletedCount: count };
  }

  @Post('articles/clear/source/:sourceId')
  @ResponseMessage('清空指定源文章成功')
  async clearArticlesBySource(@Param('sourceId') sourceId: number) {
    const result = await this.articleRepo.delete({ source: { id: sourceId } });
    return { deletedCount: result.affected || 0 };
  }
}
