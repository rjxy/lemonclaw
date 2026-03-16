import { Body, Controller, Post } from '@nestjs/common';

import { FeishuBotService } from './services';
import { ResponseMessage } from '../../common/decorators';
import { QaService } from '../../rag/services';

/**
 * 飞书控制器
 * 处理飞书事件回调
 */
@Controller('feishu')
export class FeishuController {
  constructor(
    private feishuBotService: FeishuBotService,
    private qaService: QaService,
  ) {}

  /**
   * 飞书事件回调（机器人消息）
   */
  @Post('event')
  async handleEvent(@Body() body: any) {
    // URL 验证
    if (body.type === 'url_verification') {
      return { challenge: body.challenge };
    }

    // 处理消息事件
    if (body.header?.event_type === 'im.message.receive_v1') {
      const message = body.event?.message;
      if (message?.message_type === 'text') {
        const content = JSON.parse(message.content);
        const question = content.text?.replace(/@_user_\d+/g, '').trim();

        if (question) {
          // 调用 RAG 问答
          const result = await this.qaService.answer(question);
          await this.feishuBotService.sendText(result.answer);
        }
      }
    }

    return { code: 0 };
  }

  @Post('send')
  @ResponseMessage('发送成功')
  async sendMessage(@Body('content') content: string) {
    await this.feishuBotService.sendText(content);
    return { success: true };
  }
}
