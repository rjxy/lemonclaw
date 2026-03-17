import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { Injectable, Logger } from '@nestjs/common';

import { ModelFactory } from './model-factory.service';

/**
 * 文章总结服务
 *
 * 核心职责：
 * 1. 对长文本内容进行 AI 总结，提取核心要点
 * 2. 对超长文章进行预处理压缩，避免超出模型 Token 限制
 *
 * 应用场景：
 * - RSS 资讯抓取后的自动摘要生成
 * - 飞书推送前的内容精简
 * - 向量化前的文本预处理
 *
 * 技术实现：基于 LangChain PromptTemplate + StringOutputParser 构建处理链
 */
@Injectable()
export class SummaryService {
  /** 日志记录器 */
  private readonly logger = new Logger(SummaryService.name);

  /**
   * 总结提示模板
   *
   * 约束条件：
   * - 总结控制在 200 字以内
   * - 提取 3-5 个核心要点
   * - 使用简洁明了的语言
   * - 保留关键数据和结论
   */
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

  /**
   * 构造函数
   *
   * @param modelFactory - 模型工厂服务，用于获取 AI 模型实例
   */
  constructor(private modelFactory: ModelFactory) {}

  /**
   * 生成文章总结
   *
   * 将输入的长文本通过 AI 模型生成简洁的摘要
   *
   * @param content - 需要总结的文章内容
   * @returns 生成的摘要文本（200字以内，3-5个要点）
   * @throws Error 当 AI 调用失败时抛出异常
   */
  async summarize(content: string): Promise<string> {
    try {
      // 获取当前配置的模型实例
      const model = this.modelFactory.getModel();

      // 构建处理链：提示模板 -> 模型 -> 字符串解析器
      const chain = this.summaryPrompt
        .pipe(model)
        .pipe(new StringOutputParser());

      // 执行链并返回结果
      const summary = await chain.invoke({ content });
      return summary.trim();
    } catch (error) {
      this.logger.error('生成总结失败:', error);
      throw error;
    }
  }

  /**
   * 压缩长文本
   *
   * 用于超长文章的预处理，在保留关键信息的前提下压缩文本长度
   * 当文本长度未超过限制时，直接返回原文
   *
   * @param content - 需要压缩的文本内容
   * @param maxLength - 目标最大长度，默认 8000 字符
   * @returns 压缩后的文本
   */
  async compress(content: string, maxLength: number = 8000): Promise<string> {
    // 如果内容长度未超过限制，直接返回
    if (content.length <= maxLength) {
      return content;
    }

    // 构建压缩提示模板
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
      // 降级方案：AI 压缩失败时，直接截断文本
      return content.slice(0, maxLength);
    }
  }
}
