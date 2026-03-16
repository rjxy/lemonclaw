import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { Injectable, Logger } from '@nestjs/common';

import { ModelFactory } from './model-factory.service';

/**
 * 意图解析结果
 */
export interface IntentResult {
  intent: string; // 意图类型
  params: Record<string, any>; // 提取的参数
  confidence: number; // 置信度
}

/**
 * 意图解析服务
 * 使用 Function Calling 解析用户自然语言指令
 */
@Injectable()
export class IntentParserService {
  private readonly logger = new Logger(IntentParserService.name);

  private intentPrompt = PromptTemplate.fromTemplate(`
你是一个意图解析助手。请分析用户的输入，识别意图并提取参数。

支持的意图类型：
- create_task: 创建定时任务（参数：taskName, cronExpression, action）
- query_news: 查询资讯（参数：category, keyword, timeRange）
- ask_question: 知识问答（参数：question）
- manage_source: 管理 RSS 源（参数：action, sourceName, sourceUrl）

用户输入：{input}

请以 JSON 格式输出：
{{
  "intent": "意图类型",
  "params": {{ 提取的参数 }},
  "confidence": 0.0-1.0 的置信度
}}
`);

  constructor(private modelFactory: ModelFactory) {}

  /**
   * 解析用户意图
   */
  async parse(input: string): Promise<IntentResult> {
    try {
      const model = this.modelFactory.getModel();
      const parser = new JsonOutputParser<IntentResult>();
      const chain = this.intentPrompt.pipe(model).pipe(parser);

      const result = await chain.invoke({ input });
      return result;
    } catch (error) {
      this.logger.error('意图解析失败:', error);
      return {
        intent: 'ask_question',
        params: { question: input },
        confidence: 0.5,
      };
    }
  }
}
