import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { Injectable, Logger } from '@nestjs/common';

import { ModelFactory } from './model-factory.service';

/**
 * 文章总结服务
 */
@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  // 总结提示模板
  private summaryPrompt = PromptTemplate.fromTemplate(`
你是一个专业的内容总结助手。请根据以下文章内容，提取核心要点并生成简洁的中文总结。

要求：
1. 总结控制在 200 字以内
2. 提取 3-5 个核心要点
3. 使用简洁明了的语言
4. 保留关键数据和结论

文章内容：
{content}

请输出总结：
`);

  constructor(private modelFactory: ModelFactory) {}

  /**
   * 生成文章总结
   */
  async summarize(content: string): Promise<string> {
    try {
      const model = this.modelFactory.getModel();
      const chain = this.summaryPrompt
        .pipe(model)
        .pipe(new StringOutputParser());

      const summary = await chain.invoke({ content });
      return summary.trim();
    } catch (error) {
      this.logger.error('生成总结失败:', error);
      throw error;
    }
  }

  /**
   * 压缩长文本（用于超长文章预处理）
   */
  async compress(content: string, maxLength: number = 8000): Promise<string> {
    if (content.length <= maxLength) {
      return content;
    }

    const compressPrompt = PromptTemplate.fromTemplate(`
请将以下长文本压缩到 ${maxLength} 字以内，保留关键信息：

{content}

压缩后的文本：
`);

    try {
      const model = this.modelFactory.getModel();
      const chain = compressPrompt.pipe(model).pipe(new StringOutputParser());

      const compressed = await chain.invoke({ content });
      return compressed.trim();
    } catch (error) {
      this.logger.error('压缩文本失败:', error);
      // 降级方案：直接截断
      return content.slice(0, maxLength);
    }
  }
}
