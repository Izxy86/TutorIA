import { Module } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { AiModule } from '../ai/ai.module';
import { PedagogicalModule } from '../pedagogical/pedagogical.module';
import { EvaluatorModule } from '../evaluator/evaluator.module';

@Module({
  imports: [KnowledgeModule, 
    InteractionsModule,
    AiModule,
    TutorModule,
    PedagogicalModule,
    TutorModule,
    EvaluatorModule],
  controllers: [TutorController],
  providers: [TutorService],
})
export class TutorModule {}
