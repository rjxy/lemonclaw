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

import { ResponseMessage } from '../../../common/decorators';
import { CreateRssSourceDto, UpdateRssSourceDto } from '../dto';
import { Article, RssSource } from '../entities';
import { RssCrawlerService } from '../services';

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
}
