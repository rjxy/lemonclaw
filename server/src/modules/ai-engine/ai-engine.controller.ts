import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import {
  IntentParserService,
  ModelFactory,
  ModelProvider,
  SummaryService,
} from './services';
import { ResponseMessage } from '../../common/decorators';

/**
 * AI 引擎控制器
 *
 * 提供 AI 相关的 HTTP API 接口，包括：
 * - 模型提供商管理（查询/切换）
 * - 内容总结生成
 * - 用户意图解析
 *
 * @路由前缀 /ai
 */
@Controller('ai')
export class AiEngineController {
  constructor(
    /** 模型工厂服务，用于管理和切换大模型 */
    private modelFactory: ModelFactory,
    /** 总结服务，用于生成文章摘要 */
    private summaryService: SummaryService,
    /** 意图解析服务，用于解析用户自然语言指令 */
    private intentParserService: IntentParserService,
  ) {}

  /**
   * 获取当前使用的模型提供商
   *
   * @returns 当前模型提供商名称（deepseek/qwen/openai/local）
   */
  @Get('provider')
  @ResponseMessage('获取当前模型提供商成功')
  getCurrentProvider() {
    return { provider: this.modelFactory.getCurrentProvider() };
  }

  /**
   * 切换模型提供商
   *
   * 支持运行时热切换，无需重启服务
   *
   * @param provider - 目标模型提供商（deepseek/qwen/openai/local）
   * @returns 切换后的模型提供商
   */
  @Post('provider')
  @ResponseMessage('切换模型提供商成功')
  switchProvider(@Body('provider') provider: ModelProvider) {
    this.modelFactory.switchProvider(provider);
    return { provider };
  }

  /**
   * 生成内容总结
   *
   * 对输入的长文本进行 AI 总结，提取核心要点
   *
   * @param content - 需要总结的文章内容
   * @returns 生成的摘要文本（200字以内，3-5个要点）
   */
  @Post('summarize')
  @ResponseMessage('生成总结成功')
  async summarize(@Body('content') content: string) {
    const summary = await this.summaryService.summarize(content);
    return { summary };
  }

  /**
   * 解析用户意图
   *
   * 将用户的自然语言输入解析为结构化的意图和参数
   * 支持的意图：create_task、query_news、ask_question、manage_source
   *
   * @param input - 用户输入的自然语言文本
   * @returns 解析结果，包含 intent、params、confidence
   */
  @Post('parse-intent')
  @ResponseMessage('解析意图成功')
  async parseIntent(@Body('input') input: string) {
    return this.intentParserService.parse(input);
  }

  /**
   * 简单对话测试接口（流式输出）
   *
   * 用于测试模型连通性，使用 SSE 流式返回回复
   *  用浏览器/curl 测试（推荐）

    curl -X POST http://localhost:3300/ai/chat \
      -H "Content-Type: application/json" \
      -d '{"message": "hello"}' \
      --no-buffer
   *
   * @param message - 用户消息
   * @param res - Express Response 对象
   */
  @Post('chat')
  async chat(@Body('message') message: string, @Res() res: Response) {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const model = this.modelFactory.getModel();
    const stream = await model.stream(message);

    // 流式输出每个 chunk
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // 发送结束标记
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
