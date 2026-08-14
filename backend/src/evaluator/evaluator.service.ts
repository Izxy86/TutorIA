import { Injectable } from '@nestjs/common';
import { ActivityType } from '../../generated/prisma/client';

export interface EvaluationResult {
  valid: boolean;
  reason?: string;
}

@Injectable()
export class EvaluatorService {
  evaluate(
    question: string,
    response: string,
    activityType: ActivityType,
  ): EvaluationResult {
    if (!response || response.trim().length < 20) {
      return {
        valid: false,
        reason: 'La respuesta es demasiado corta o está vacía.',
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
        };
      }
    }

    return {
      valid: true,
    };
  }
}