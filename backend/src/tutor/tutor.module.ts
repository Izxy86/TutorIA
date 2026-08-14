import { Module } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { InteractionsModule } from '../interactions/interactions.module';

@Module({
  imports: [KnowledgeModule, InteractionsModule],
  controllers: [TutorController],
  providers: [TutorService],
})
export class TutorModule {}
