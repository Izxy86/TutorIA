import { Module } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { AiModule } from '../ai/ai.module';
import { PedagogicalModule } from '../pedagogical/pedagogical.module';
import { EvaluatorModule } from '../evaluator/evaluator.module';
import { ProgressModule } from '../progress/progress.module';
import { AnswerEvaluatorService } from '../answer-evaluator/answer-evaluator.service';

@Module({
  imports: [KnowledgeModule, 
    InteractionsModule,
    AiModule,
    TutorModule,
    PedagogicalModule,
    TutorModule,
    EvaluatorModule,
    ProgressModule],
  controllers: [TutorController],
  providers: [TutorService,
    AnswerEvaluatorService,
  ],
})
export class TutorModule {}
