import { Injectable } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { InteractionsService } from '../interactions/interactions.service';
import { ActivityType } from '../../generated/prisma/client';

@Injectable()
export class TutorService {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly interactionsService: InteractionsService,
  ) {}

  async ask(
    userId: string,
    subjectId: string,
    question: string,
    activityType: ActivityType,
  ) {
    const terms = question
      .toLowerCase()
      .replace(/[¿?¡!.,]/g, '')
      .split(' ')
      .filter((word) => word.length > 4);

    for (const term of terms) {
      const results = await this.knowledgeService.search(subjectId, term);

      if (results.length > 0) {
        const item = results[0];
        const response = item.content;

        await this.interactionsService.create(
          userId,
          subjectId,
          question,
          response,
          activityType,
          false,
        );

        return {
          source: 'LOCAL',
          usedAI: false,
          response,
        };
      }
    }

    return {
      source: 'NONE',
      usedAI: false,
      response: null,
      message: 'No se encontró información suficiente en la base local.',
    };
  }
}