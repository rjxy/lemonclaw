import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 模型提供商类型
 *
 * - deepseek: DeepSeek 大模型，高性价比首选
 * - qwen: 通义千问，阿里云大模型服务
 * - openai: OpenAI GPT 系列模型
 * - local: 本地模型，通过 Ollama 运行
 */
export type ModelProvider = 'deepseek' | 'qwen' | 'openai' | 'local';

/**
 * 大模型工厂服务
 *
 * 核心职责：
 * 1. 统一封装多种大模型的创建和管理
 * 2. 提供运行时动态切换模型的能力
 * 3. 使用单例模式缓存模型实例，避免重复创建
 *
 * 设计模式：工厂模式 + 单例模式
 * 依赖：LangChain BaseChatModel 作为统一抽象层
 */
@Injectable()
export class ModelFactory {
  /** 日志记录器 */
  private readonly logger = new Logger(ModelFactory.name);

  /** 当前使用的模型提供商 */
  private currentProvider: ModelProvider;

  /** 缓存的模型实例，避免重复创建 */
  private modelInstance: BaseChatModel | null = null;

  /**
   * 构造函数
   *
   * @param configService - NestJS 配置服务，用于读取环境变量
   */
  constructor(private configService: ConfigService) {
    // 从配置中读取默认模型提供商，默认使用 qwen
    this.currentProvider = this.configService.get<ModelProvider>(
      'ai.provider',
      'qwen',
    );
  }

  /**
   * 获取当前模型实例
   *
   * 使用懒加载模式，首次调用时创建实例并缓存
   *
   * @returns LangChain BaseChatModel 实例
   */
  getModel(): BaseChatModel {
    if (!this.modelInstance) {
      this.modelInstance = this.createModel(this.currentProvider);
    }
    return this.modelInstance;
  }

  /**
   * 切换模型提供商
   *
   * 支持运行时热切换，会创建新的模型实例替换旧实例
   * 注意：切换会导致之前的模型实例被废弃
   *
   * @param provider - 目标模型提供商
   * @returns 新创建的模型实例
   */
  switchProvider(provider: ModelProvider): BaseChatModel {
    this.logger.log(`切换模型提供商: ${this.currentProvider} -> ${provider}`);
    this.currentProvider = provider;
    // 创建新实例并替换缓存
    this.modelInstance = this.createModel(provider);
    return this.modelInstance;
  }

  /**
   * 获取当前使用的提供商名称
   *
   * @returns 当前模型提供商标识
   */
  getCurrentProvider(): ModelProvider {
    return this.currentProvider;
  }

  /**
   * 创建模型实例（私有方法）
   *
   * 根据提供商类型创建对应的 LangChain ChatModel 实例
   * 所有模型都使用 ChatOpenAI 类，因为主流模型都兼容 OpenAI API 格式
   *
   * @param provider - 模型提供商类型
   * @returns 创建的模型实例
   * @throws Error 当提供商类型不支持时抛出异常
   */
  private createModel(provider: ModelProvider): BaseChatModel {
    switch (provider) {
      // DeepSeek 模型配置
      case 'deepseek':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.deepseek.model'),
          openAIApiKey: this.configService.get('ai.deepseek.apiKey'),
          configuration: {
            baseURL: this.configService.get('ai.deepseek.baseUrl'),
          },
        });

      // 通义千问模型配置
      case 'qwen':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.qwen.model'),
          openAIApiKey: this.configService.get('ai.qwen.apiKey'),
          configuration: {
            baseURL: this.configService.get('ai.qwen.baseUrl'),
          },
        });

      // OpenAI 模型配置
      case 'openai':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.openai.model'),
          openAIApiKey: this.configService.get('ai.openai.apiKey'),
          configuration: {
            baseURL: this.configService.get('ai.openai.baseUrl'),
          },
        });

      // 本地模型配置（通过 Ollama）
      case 'local':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.local.model'),
          openAIApiKey: 'ollama', // Ollama 不需要真实 API Key，使用占位符
          configuration: {
            // Ollama 需要在 baseUrl 后追加 /v1 以兼容 OpenAI API 格式
            baseURL: this.configService.get('ai.local.baseUrl') + '/v1',
          },
        });

      default:
        throw new Error(`不支持的模型提供商: ${provider}`);
    }
  }
}
