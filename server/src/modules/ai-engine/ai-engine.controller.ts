import { Body, Controller, Get, Post } from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators';
import {
  IntentParserService,
  ModelFactory,
  ModelProvider,
  SummaryService,
} from './services';

@Controller('ai')
export class AiEngineController {
  constructor(
    private modelFactory: ModelFactory,
    private summaryService: SummaryService,
    private intentParserService: IntentParserService,
  ) {}

  @Get('provider')
  @ResponseMessage('获取当前模型提供商成功')
  getCurrentProvider() {
    return { provider: this.modelFactory.getCurrentProvider() };
  }

  @Post('provider')
  @ResponseMessage('切换模型提供商成功')
  switchProvider(@Body('provider') provider: ModelProvider) {
    this.modelFactory.switchProvider(provider);
    return { provider };
  }

  @Post('summarize')
  @ResponseMessage('生成总结成功')
  async summarize(@Body('content') content: string) {
    const summary = await this.summaryService.summarize(content);
    return { summary };
  }

  @Post('parse-intent')
  @ResponseMessage('解析意图成功')
  async parseIntent(@Body('input') input: string) {
    return this.intentParserService.parse(input);
  }
}
