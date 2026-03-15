import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

/**
 * 网页正文提取工具
 * 优先使用 Readability，备用 cheerio
 */
export class ContentExtractor {
  /**
   * 使用 Readability 提取正文
   * @param html 网页 HTML
   * @param url 网页 URL
   */
  static extractWithReadability(
    html: string,
    url: string,
  ): { title: string; content: string } | null {
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article) {
        return {
          title: article.title,
          content: article.textContent?.trim() ?? '',
        };
      }
    } catch (error) {
      console.error('Readability 提取失败:', error);
    }
    return null;
  }

  /**
   * 使用 cheerio 提取正文（备用方案）
   * @param html 网页 HTML
   */
  static extractWithCheerio(html: string): { title: string; content: string } {
    const $ = cheerio.load(html);

    // 移除无用元素
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim();
    const content =
      $('article').text().trim() ||
      $('main').text().trim() ||
      $('body').text().trim();

    return {
      title,
      content: content.replace(/\s+/g, ' ').trim(),
    };
  }

  /**
   * 智能提取正文（自动选择最佳方案）
   * @param html 网页 HTML
   * @param url 网页 URL
   */
  static extract(
    html: string,
    url: string,
  ): { title: string; content: string } {
    // 优先使用 Readability
    const result = this.extractWithReadability(html, url);
    if (result && result.content.length > 100) {
      return result;
    }

    // 备用 cheerio
    return this.extractWithCheerio(html);
  }
}
