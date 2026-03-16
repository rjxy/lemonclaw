import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 模型提供商类型
 */
export type ModelProvider = 'deepseek' | 'qwen' | 'openai' | 'local';

/**
 * 大模型工厂
 * 统一封装多模型切换能力
 */
@Injectable()
export class ModelFactory {
  private readonly logger = new Logger(ModelFactory.name);
  private currentProvider: ModelProvider;
  private modelInstance: BaseChatModel | null = null;

  constructor(private configService: ConfigService) {
    this.currentProvider = this.configService.get<ModelProvider>(
      'ai.provider',
      'deepseek',
    );
  }

  /**
   * 获取当前模型实例
   */
  getModel(): BaseChatModel {
    if (!this.modelInstance) {
      this.modelInstance = this.createModel(this.currentProvider);
    }
    return this.modelInstance;
  }

  /**
   * 切换模型提供商
   */
  switchProvider(provider: ModelProvider): BaseChatModel {
    this.logger.log(`切换模型提供商: ${this.currentProvider} -> ${provider}`);
    this.currentProvider = provider;
    this.modelInstance = this.createModel(provider);
    return this.modelInstance;
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider(): ModelProvider {
    return this.currentProvider;
  }

  /**
   * 创建模型实例
   */
  private createModel(provider: ModelProvider): BaseChatModel {
    switch (provider) {
      case 'deepseek':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.deepseek.model'),
          openAIApiKey: this.configService.get('ai.deepseek.apiKey'),
          configuration: {
            baseURL: this.configService.get('ai.deepseek.baseUrl'),
          },
        });

      case 'qwen':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.qwen.model'),
          openAIApiKey: this.configService.get('ai.qwen.apiKey'),
          configuration: {
            baseURL: this.configService.get('ai.qwen.baseUrl'),
          },
        });

      case 'openai':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.openai.model'),
          openAIApiKey: this.configService.get('ai.openai.apiKey'),
          configuration: {
            baseURL: this.configService.get('ai.openai.baseUrl'),
          },
        });

      case 'local':
        return new ChatOpenAI({
          modelName: this.configService.get('ai.local.model'),
          openAIApiKey: 'ollama', // Ollama 不需要真实 API Key
          configuration: {
            baseURL: this.configService.get('ai.local.baseUrl') + '/v1',
          },
        });

      default:
        throw new Error(`不支持的模型提供商: ${provider}`);
    }
  }
}
