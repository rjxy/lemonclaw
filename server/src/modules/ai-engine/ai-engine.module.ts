import { Module } from '@nestjs/common';

import { AiEngineController } from './ai-engine.controller';
import { IntentParserService, ModelFactory, SummaryService } from './services';

@Module({
  controllers: [AiEngineController],
  providers: [ModelFactory, SummaryService, IntentParserService],
  exports: [ModelFactory, SummaryService, IntentParserService],
})
export class AiEngineModule {}
