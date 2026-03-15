import { Injectable, Logger } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';

/**
 * YouTube 内容抓取服务
 */
@Injectable()
export class YoutubeCrawlerService {
  private readonly logger = new Logger(YoutubeCrawlerService.name);

  /**
   * 获取视频字幕
   * @param videoId YouTube 视频 ID
   */
  async getTranscript(videoId: string): Promise<string> {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      return transcript.map((item) => item.text).join(' ');
    } catch (error) {
      this.logger.error(`获取 YouTube 字幕失败: ${videoId}`, error);
      return '';
    }
  }

  /**
   * 从 URL 提取视频 ID
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}
