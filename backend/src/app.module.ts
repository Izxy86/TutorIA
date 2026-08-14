import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SubjectsModule } from './subjects/subjects.module';
import { UsersModule } from './users/users.module';
import { InteractionsModule } from './interactions/interactions.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { TutorModule } from './tutor/tutor.module';

@Module({
  imports: [PrismaModule, SubjectsModule, UsersModule, InteractionsModule, KnowledgeModule, TutorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
