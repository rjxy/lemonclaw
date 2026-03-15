import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';

import { EmbeddingService } from './embedding.service';

/**
 * 向量存储服务
 * 封装 Chroma / Pinecone 操作
 */
@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private vectorStore: Chroma | null = null;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
  ) {}

  /**
   * 获取向量存储实例
   */
  async getStore(): Promise<Chroma> {
    if (!this.vectorStore) {
      const chromaUrl = this.configService.get('vector.chroma.url');
      const collection = this.configService.get('vector.chroma.collection');

      this.vectorStore = new Chroma(this.embeddingService.getEmbeddings(), {
        url: chromaUrl,
        collectionName: collection,
      });
    }
    return this.vectorStore;
  }

  /**
   * 添加文档到向量库
   */
  async addDocuments(
    documents: { content: string; metadata: Record<string, any> }[],
  ): Promise<void> {
    try {
      const store = await this.getStore();
      const docs = documents.map(
        (doc) =>
          new Document({
            pageContent: doc.content,
            metadata: doc.metadata,
          }),
      );

      await store.addDocuments(docs);
      this.logger.log(`成功添加 ${docs.length} 个文档到向量库`);
    } catch (error) {
      this.logger.error('添加文档失败:', error);
      throw error;
    }
  }

  /**
   * 相似度搜索
   */
  async search(
    query: string,
    topK: number = 5,
  ): Promise<{ content: string; metadata: Record<string, any>; score: number }[]> {
    try {
      const store = await this.getStore();
      const results = await store.similaritySearchWithScore(query, topK);

      return results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score,
      }));
    } catch (error) {
      this.logger.error('相似度搜索失败:', error);
      throw error;
    }
  }

  /**
   * 删除文档
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      const store = await this.getStore();
      await store.delete({ ids });
      this.logger.log(`成功删除 ${ids.length} 个文档`);
    } catch (error) {
      this.logger.error('删除文档失败:', error);
      throw error;
    }
  }
}
