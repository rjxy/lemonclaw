import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { Injectable, Logger } from '@nestjs/common';

import { ModelFactory } from './model-factory.service';

/**
 * 意图解析结果接口
 *
 * 定义 AI 解析用户输入后返回的结构化数据格式
 */
export interface IntentResult {
  /** 意图类型：create_task / query_news / ask_question / manage_source */
  intent: string;
  /** 从用户输入中提取的结构化参数 */
  params: Record<string, any>;
  /** 解析置信度，范围 0.0-1.0，越高表示解析越可靠 */
  confidence: number;
}

/**
 * 意图解析服务
 *
 * 核心职责：
 * 使用 AI 模型解析用户的自然语言输入，识别用户意图并提取结构化参数
 *
 * 支持的意图类型：
 * - create_task: 创建定时任务（如"每天早上9点推送新闻"）
 * - query_news: 查询资讯（如"查找最近的AI新闻"）
 * - ask_question: 知识问答（如"什么是RAG？"）
 * - manage_source: 管理 RSS 源（如"添加一个新的RSS源"）
 *
 * 技术实现：基于 LangChain PromptTemplate + JsonOutputParser 构建处理链
 */
@Injectable()
export class IntentParserService {
  /** 日志记录器 */
  private readonly logger = new Logger(IntentParserService.name);

  /**
   * 意图解析提示模板
   *
   * 指导 AI 模型识别用户意图类型，并以 JSON 格式输出结果
   * 包含所有支持的意图类型及其对应参数说明
   */
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

  /**
   * 构造函数
   *
   * @param modelFactory - 模型工厂服务，用于获取 AI 模型实例
   */
  constructor(private modelFactory: ModelFactory) {}

  /**
   * 解析用户意图
   *
   * 将用户的自然语言输入解析为结构化的意图和参数
   *
   * @param input - 用户输入的自然语言文本
   * @returns 解析结果，包含意图类型、参数和置信度
   *
   * @example
   * // 输入："帮我创建一个每天早上9点推送科技新闻的任务"
   * // 输出：{
   * //   intent: "create_task",
   * //   params: { taskName: "科技新闻推送", cronExpression: "0 9 * * *", action: "push_news" },
   * //   confidence: 0.92
   * // }
   */
  async parse(input: string): Promise<IntentResult> {
    try {
      // 获取当前配置的模型实例
      const model = this.modelFactory.getModel();

      // 创建 JSON 输出解析器，自动将模型输出解析为 IntentResult 类型
      const parser = new JsonOutputParser<IntentResult>();

      // 构建处理链：提示模板 -> 模型 -> JSON 解析器
      const chain = this.intentPrompt.pipe(model).pipe(parser);

      // 执行链并返回结果
      const result = await chain.invoke({ input });
      return result;
    } catch (error) {
      this.logger.error('意图解析失败:', error);
      // 降级方案：解析失败时，默认返回问答意图，将原始输入作为问题
      return {
        intent: 'ask_question',
        params: { question: input },
        confidence: 0.5, // 降级结果置信度设为 0.5，表示不确定
      };
    }
  }
}
