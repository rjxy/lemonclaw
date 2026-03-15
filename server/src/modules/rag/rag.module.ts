import { Module } from '@nestjs/common';

import { AiEngineModule } from '../ai-engine';
import { RagController } from './rag.controller';
import { EmbeddingService, QaService, VectorStoreService } from './services';

@Module({
  imports: [AiEngineModule],
  controllers: [RagController],
  providers: [EmbeddingService, VectorStoreService, QaService],
  exports: [EmbeddingService, VectorStoreService, QaService],
})
export class RagModule {}
