import { Module } from '@nestjs/common';

import { RagModule } from '../rag';
import { FeishuController } from './feishu.controller';
import { FeishuBotService, FeishuDocService } from './services';

@Module({
  imports: [RagModule],
  controllers: [FeishuController],
  providers: [FeishuBotService, FeishuDocService],
  exports: [FeishuBotService, FeishuDocService],
})
export class FeishuModule {}
