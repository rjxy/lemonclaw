import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Embedding 服务
 * 用于文档向量化
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private embeddings: Embeddings;

  constructor(private configService: ConfigService) {
    this.embeddings = this.createEmbeddings();
  }

  /**
   * 获取 Embedding 实例
   */
  getEmbeddings(): Embeddings {
    return this.embeddings;
  }

  /**
   * 将文本转换为向量
   */
  async embedText(text: string): Promise<number[]> {
    try {
      const vectors = await this.embeddings.embedQuery(text);
      return vectors;
    } catch (error) {
      this.logger.error('向量化失败:', error);
      throw error;
    }
  }

  /**
   * 批量向量化
   */
  async embedTexts(texts: string[]): Promise<number[][]> {
    try {
      return await this.embeddings.embedDocuments(texts);
    } catch (error) {
      this.logger.error('批量向量化失败:', error);
      throw error;
    }
  }

  private createEmbeddings(): Embeddings {
    const provider = this.configService.get('ai.embedding.provider', 'qwen');
    const model = this.configService.get(
      'ai.embedding.model',
      'text-embedding-v3',
    );

    this.logger.log(`初始化 Embedding: provider=${provider}, model=${model}`);

    // 根据 embedding provider 选择 API 配置
    if (provider === 'qwen') {
      // 阿里 DashScope 兼容 OpenAI 格式
      const qwenConfig = this.configService.get('ai.qwen');
      return new OpenAIEmbeddings({
        modelName: model,
        openAIApiKey: qwenConfig?.apiKey,
        configuration: {
          baseURL:
            qwenConfig?.baseUrl ||
            'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
      });
    }

    // OpenAI / 其他兼容提供商
    const aiProvider = this.configService.get('ai.provider', 'openai');
    const config = this.configService.get(`ai.${aiProvider}`);

    return new OpenAIEmbeddings({
      modelName: model,
      openAIApiKey: config?.apiKey,
      configuration: {
        baseURL: config?.baseUrl,
      },
    });
  }
}
