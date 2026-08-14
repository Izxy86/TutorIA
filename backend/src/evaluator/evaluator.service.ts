import { Injectable } from '@nestjs/common';
import { ActivityType } from '../../generated/prisma/client';

export interface EvaluationResult {
  valid: boolean;
  reason?: string;
  suspectedEvasion: boolean;
  needsHelp: boolean;
}

@Injectable()
export class EvaluatorService {
  evaluate(
    question: string,
    response: string,
    activityType: ActivityType,
  ): EvaluationResult {
    const normalizedQuestion = question.toLowerCase();

    const suspectedEvasion =
      /dame la respuesta|solo la respuesta|decime el resultado|sin explicar|resolvelo por mi|haceme la tarea/i.test(
        normalizedQuestion,
      );

    const needsHelp =
      /no entiendo|no sé|me cuesta|ayuda|explicame|explícame/i.test(
        normalizedQuestion,
      );

    if (!response || response.trim().length < 20) {
      return {
        valid: false,
        reason: 'La respuesta es demasiado corta o está vacía.',
        suspectedEvasion,
        needsHelp,
      };
    }

    if (activityType === 'PRACTICE') {
      const givesDirectAnswer =
        /la respuesta es|el resultado es|resultado final|= \d+/i.test(response);

      if (givesDirectAnswer) {
        return {
          valid: false,
          reason:
            'En modo práctica no debe entregarse directamente la solución.',
          suspectedEvasion,
          needsHelp,
        };
      }
    }

    if (activityType === 'EXAM') {
      const givesSolution =
        /la respuesta es|el resultado es|solución|= \d+/i.test(response);

      if (givesSolution) {
        return {
          valid: false,
          reason:
            'Durante una evaluación no debe proporcionarse la solución.',
          suspectedEvasion,
          needsHelp,
        };
      }
    }

    return {
      valid: true,
      suspectedEvasion,
      needsHelp,
    };
  }
}