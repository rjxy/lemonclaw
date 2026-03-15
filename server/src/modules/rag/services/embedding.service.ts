import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Embeddings } from '@langchain/core/embeddings';

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
    const provider = this.configService.get('ai.embedding.provider', 'openai');
    const model = this.configService.get(
      'ai.embedding.model',
      'text-embedding-3-small',
    );

    // 根据当前 AI 提供商配置 Embedding
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
