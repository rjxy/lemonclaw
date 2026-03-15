import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 飞书机器人服务
 * 处理消息推送和 Webhook
 */
@Injectable()
export class FeishuBotService {
  private readonly logger = new Logger(FeishuBotService.name);
  private webhookUrl: string;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get('feishu.webhookUrl') || '';
  }

  /**
   * 发送文本消息
   */
  async sendText(content: string): Promise<boolean> {
    return this.send({
      msg_type: 'text',
      content: { text: content },
    });
  }

  /**
   * 发送富文本消息
   */
  async sendRichText(
    title: string,
    content: { tag: string; text?: string; href?: string }[][],
  ): Promise<boolean> {
    return this.send({
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title,
            content,
          },
        },
      },
    });
  }

  /**
   * 发送资讯卡片
   */
  async sendArticleCard(article: {
    title: string;
    summary: string;
    link: string;
    category?: string;
  }): Promise<boolean> {
    return this.send({
      msg_type: 'interactive',
      card: {
        header: {
          title: {
            tag: 'plain_text',
            content: article.title,
          },
          template: 'blue',
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: article.summary,
            },
          },
          {
            tag: 'hr',
          },
          {
            tag: 'action',
            actions: [
              {
                tag: 'button',
                text: {
                  tag: 'plain_text',
                  content: '查看原文',
                },
                url: article.link,
                type: 'primary',
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * 发送消息到 Webhook
   */
  private async send(payload: Record<string, any>): Promise<boolean> {
    if (!this.webhookUrl) {
      this.logger.warn('飞书 Webhook URL 未配置');
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.code !== 0) {
        this.logger.error('飞书消息发送失败:', result);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('飞书消息发送异常:', error);
      return false;
    }
  }
}
