import { Injectable, Logger } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

import { ModelFactory } from '../../ai-engine/services';
import { VectorStoreService } from './vector-store.service';

/**
 * RAG 问答服务
 * 基于知识库的智能问答
 */
@Injectable()
export class QaService {
  private readonly logger = new Logger(QaService.name);

  private qaPrompt = PromptTemplate.fromTemplate(`
你是一个智能问答助手。请根据以下相关文档内容回答用户问题。

相关文档：
{context}

用户问题：{question}

要求：
1. 仅根据提供的文档内容回答
2. 如果文档中没有相关信息，请说明"根据现有资料无法回答"
3. 回答要简洁准确

请回答：
`);

  constructor(
    private vectorStoreService: VectorStoreService,
    private modelFactory: ModelFactory,
  ) {}

  /**
   * RAG 问答
   */
  async answer(question: string): Promise<{
    answer: string;
    sources: { content: string; metadata: Record<string, any> }[];
  }> {
    try {
      // 1. 检索相关文档
      const searchResults = await this.vectorStoreService.search(question, 5);

      if (searchResults.length === 0) {
        return {
          answer: '抱歉，知识库中暂无相关信息。',
          sources: [],
        };
      }

      // 2. 构建上下文
      const context = searchResults
        .map((r, i) => `[${i + 1}] ${r.content}`)
        .join('\n\n');

      // 3. 生成回答
      const model = this.modelFactory.getModel();
      const chain = this.qaPrompt.pipe(model).pipe(new StringOutputParser());

      const answer = await chain.invoke({ context, question });

      return {
        answer: answer.trim(),
        sources: searchResults.map((r) => ({
          content: r.content.slice(0, 200) + '...',
          metadata: r.metadata,
        })),
      };
    } catch (error) {
      this.logger.error('问答失败:', error);
      throw error;
    }
  }
}
