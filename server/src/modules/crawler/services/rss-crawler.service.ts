import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Parser from 'rss-parser';
import { Repository } from 'typeorm';

import { ContentExtractor } from '../../../common/utils';
import { Article, RssSource } from '../entities';

/**
 * RSS 抓取服务
 */
@Injectable()
export class RssCrawlerService {
  private readonly logger = new Logger(RssCrawlerService.name);
  private readonly parser = new Parser();

  constructor(
    @InjectRepository(RssSource)
    private rssSourceRepo: Repository<RssSource>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
  ) {}

  /**
   * 抓取指定 RSS 源
   */
  async fetchSource(source: RssSource): Promise<Article[]> {
    try {
      this.logger.log(`开始抓取 RSS 源: ${source.name}`);
      const feed = await this.parser.parseURL(source.url);
      const articles: Article[] = [];

      for (const item of feed.items) {
        // 跳过已存在的文章
        const exists = await this.articleRepo.findOne({
          where: { link: item.link },
        });
        if (exists) continue;

        const article = this.articleRepo.create({
          title: item.title || '无标题',
          link: item.link || '',
          summary: item.contentSnippet || item.summary || '',
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          source,
        });

        articles.push(await this.articleRepo.save(article));
      }

      // 更新最后抓取时间
      source.lastFetchedAt = new Date();
      await this.rssSourceRepo.save(source);

      this.logger.log(`抓取完成: ${source.name}, 新增 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      this.logger.error(`抓取失败: ${source.name}`, error);
      return [];
    }
  }

  /**
   * 抓取所有启用的 RSS 源
   */
  async fetchAllSources(): Promise<Article[]> {
    const sources = await this.rssSourceRepo.find({ where: { enabled: true } });
    const allArticles: Article[] = [];

    for (const source of sources) {
      const articles = await this.fetchSource(source);
      allArticles.push(...articles);
    }

    return allArticles;
  }

  /**
   * 提取文章正文
   */
  async extractContent(article: Article): Promise<Article> {
    try {
      const response = await fetch(article.link);
      const html = await response.text();
      const extracted = ContentExtractor.extract(html, article.link);

      article.content = extracted.content;
      return await this.articleRepo.save(article);
    } catch (error) {
      this.logger.error(`正文提取失败: ${article.link}`, error);
      return article;
    }
  }
}
