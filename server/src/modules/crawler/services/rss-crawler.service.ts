import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Parser from 'rss-parser';
import { Repository } from 'typeorm';

import { ContentExtractor } from '../../../common/utils';
import { getEnabledSources } from '../../../config/rss.config';
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

      this.logger.log(
        `抓取完成: ${source.name}, 新增 ${articles.length} 篇文章`,
      );
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

  /**
   * 从 JSON 配置初始化 RSS 源到数据库
   * 只导入数据库中不存在的源
   */
  async initSourcesFromConfig(): Promise<RssSource[]> {
    const configSources = getEnabledSources();
    const importedSources: RssSource[] = [];

    for (const config of configSources) {
      // 检查是否已存在（根据 url 判断）
      const exists = await this.rssSourceRepo.findOne({
        where: { url: config.url },
      });
      if (exists) {
        this.logger.log(`RSS 源已存在，跳过: ${config.name}`);
        continue;
      }

      const source = this.rssSourceRepo.create({
        name: config.name,
        url: config.url,
        category: config.category,
        enabled: config.enabled,
        fetchInterval: config.interval,
      });

      const saved = await this.rssSourceRepo.save(source);
      importedSources.push(saved);
      this.logger.log(`导入 RSS 源: ${config.name}`);
    }

    this.logger.log(`初始化完成，共导入 ${importedSources.length} 个 RSS 源`);
    return importedSources;
  }

  /**
   * 测试抓取：只抓取一个源的少量文章，并写入测试文档
   * @param sourceId 源 ID（可选，默认取第一个启用的源）
   * @param maxArticles 最大抓取数量（默认 3）
   */
  async testFetch(
    sourceId?: number,
    maxArticles: number = 3,
  ): Promise<{ articles: Article[]; outputPath: string }> {
    // 获取源
    let source: RssSource | null;
    if (sourceId) {
      source = await this.rssSourceRepo.findOne({ where: { id: sourceId } });
    } else {
      source = await this.rssSourceRepo.findOne({ where: { enabled: true } });
    }

    if (!source) {
      throw new Error('未找到可用的 RSS 源，请先调用 initSourcesFromConfig');
    }

    this.logger.log(`测试抓取 RSS 源: ${source.name}，限制 ${maxArticles} 篇`);

    // 解析 RSS
    const feed = await this.parser.parseURL(source.url);
    const articles: Article[] = [];

    // 只处理前 N 篇
    const items = feed.items.slice(0, maxArticles);
    for (const item of items) {
      // 跳过已存在的文章
      const exists = await this.articleRepo.findOne({
        where: { link: item.link },
      });
      if (exists) {
        this.logger.log(`文章已存在，跳过: ${item.title}`);
        continue;
      }

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

    // 写入测试文档
    const outputPath = await this.writeTestOutput(source, articles);

    this.logger.log(
      `测试抓取完成，新增 ${articles.length} 篇，输出: ${outputPath}`,
    );
    return { articles, outputPath };
  }

  /**
   * 将抓取结果写入测试文档
   */
  private async writeTestOutput(
    source: RssSource,
    articles: Article[],
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.resolve(__dirname, '../../../../test-output');
    const outputPath = path.join(outputDir, `crawl-test-${timestamp}.md`);

    // 确保目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 构建 Markdown 内容
    const lines: string[] = [
      '# RSS 抓取测试结果',
      '',
      `- **抓取时间**: ${new Date().toLocaleString('zh-CN')}`,
      `- **RSS 源**: ${source.name}`,
      `- **源地址**: ${source.url}`,
      `- **文章数量**: ${articles.length}`,
      '',
      '---',
      '',
    ];

    for (const article of articles) {
      lines.push(`## ${article.title}`);
      lines.push('');
      lines.push(`- **链接**: ${article.link}`);
      lines.push(
        `- **发布时间**: ${article.publishedAt?.toLocaleString('zh-CN') || '未知'}`,
      );
      lines.push('');
      lines.push('### 摘要');
      lines.push('');
      lines.push(article.summary || '（无摘要）');
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    return outputPath;
  }
}
