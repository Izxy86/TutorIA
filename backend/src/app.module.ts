import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SubjectsModule } from './subjects/subjects.module';
import { UsersModule } from './users/users.module';
import { InteractionsModule } from './interactions/interactions.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { TutorModule } from './tutor/tutor.module';
import { AiModule } from './ai/ai.module';
import { PedagogicalModule } from './pedagogical/pedagogical.module';
import { EvaluatorModule } from './evaluator/evaluator.module';
import { ProgressModule } from './progress/progress.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [PrismaModule, SubjectsModule, UsersModule, InteractionsModule, KnowledgeModule, TutorModule, AiModule, PedagogicalModule, EvaluatorModule, ProgressModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
