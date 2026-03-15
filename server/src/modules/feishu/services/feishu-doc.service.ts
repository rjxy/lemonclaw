import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 飞书文档服务
 * 处理文档读写和归档
 */
@Injectable()
export class FeishuDocService {
  private readonly logger = new Logger(FeishuDocService.name);
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpireAt: number = 0;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get('feishu.appId') || '';
    this.appSecret = this.configService.get('feishu.appSecret') || '';
  }

  /**
   * 获取 tenant_access_token
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireAt) {
      return this.accessToken;
    }

    try {
      const response = await fetch(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_id: this.appId,
            app_secret: this.appSecret,
          }),
        },
      );

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.msg);
      }

      this.accessToken = result.tenant_access_token;
      // Token 有效期 2 小时，提前 5 分钟刷新
      this.tokenExpireAt = Date.now() + (result.expire - 300) * 1000;

      return this.accessToken!;
    } catch (error) {
      this.logger.error('获取飞书 Token 失败:', error);
      throw error;
    }
  }

  /**
   * 创建文档
   */
  async createDocument(
    title: string,
    folderId?: string,
  ): Promise<{ documentId: string; url: string }> {
    const token = await this.getAccessToken();
    const targetFolderId =
      folderId || this.configService.get('feishu.docFolderId');

    try {
      const response = await fetch(
        'https://open.feishu.cn/open-apis/docx/v1/documents',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            folder_token: targetFolderId,
          }),
        },
      );

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.msg);
      }

      return {
        documentId: result.data.document.document_id,
        url: result.data.document.url,
      };
    } catch (error) {
      this.logger.error('创建飞书文档失败:', error);
      throw error;
    }
  }

  /**
   * 追加文档内容
   */
  async appendContent(documentId: string, content: string): Promise<void> {
    const token = await this.getAccessToken();

    try {
      // 获取文档最后一个 block
      const blocksResponse = await fetch(
        `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const blocksResult = await blocksResponse.json();

      // 创建新的文本块
      await fetch(
        `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            children: [
              {
                block_type: 2, // 文本块
                text: {
                  elements: [{ text_run: { content } }],
                },
              },
            ],
          }),
        },
      );

      this.logger.log(`成功追加内容到文档: ${documentId}`);
    } catch (error) {
      this.logger.error('追加文档内容失败:', error);
      throw error;
    }
  }
}
