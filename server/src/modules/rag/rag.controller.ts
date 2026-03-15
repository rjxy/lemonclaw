import { Body, Controller, Post } from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators';
import { QaService, VectorStoreService } from './services';

@Controller('rag')
export class RagController {
  constructor(
    private vectorStoreService: VectorStoreService,
    private qaService: QaService,
  ) {}

  @Post('index')
  @ResponseMessage('文档索引成功')
  async indexDocuments(
    @Body()
    body: {
      documents: { content: string; metadata: Record<string, any> }[];
    },
  ) {
    await this.vectorStoreService.addDocuments(body.documents);
    return { count: body.documents.length };
  }

  @Post('search')
  @ResponseMessage('搜索成功')
  async search(@Body('query') query: string, @Body('topK') topK?: number) {
    return this.vectorStoreService.search(query, topK);
  }

  @Post('ask')
  @ResponseMessage('问答成功')
  async ask(@Body('question') question: string) {
    return this.qaService.answer(question);
  }
}
