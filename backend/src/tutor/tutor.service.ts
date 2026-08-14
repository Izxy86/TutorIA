import { Injectable } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AiService } from '../ai/ai.service';
import { ActivityType } from '../../generated/prisma/client';
import { PedagogicalService } from '../pedagogical/pedagogical.service';
import { EvaluatorService } from '../evaluator/evaluator.service';

@Injectable()
export class TutorService {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly interactionsService: InteractionsService,
    private readonly aiService: AiService,
    private readonly pedagogicalService: PedagogicalService,
    private readonly evaluatorService: EvaluatorService,
  ) {}

  async ask(
    userId: string,
    subjectId: string,
    question: string,
    activityType: ActivityType,
  ) {
    // 1. Buscar primero conocimiento local relevante
    const localResults = await this.knowledgeService.findRelevant(
      subjectId,
      question,
    );

    if (localResults.length > 0) {
      const response = localResults[0].content;

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
        validated: true,
        validationReason: null,
        response,
      };
    }

    // 2. Definir estrategia pedagógica
    const pedagogicalInstruction =
      this.pedagogicalService.getInstruction(activityType);

    // 3. Construir prompt inicial
    const prompt = `
Sos TutorIA, un tutor educativo institucional.

Pregunta del estudiante:
${question}

Tipo de actividad:
${activityType}

Regla pedagógica:
${pedagogicalInstruction}

Cumplí estrictamente la regla pedagógica indicada.
`;

    // 4. Consultar IA
    let response = await this.aiService.generate(prompt);

    // 5. Evaluar respuesta
    let evaluation = this.evaluatorService.evaluate(
      question,
      response,
      activityType,
    );

    let attempts = 0;

    // 6. Reintentar una vez si la respuesta no cumple las reglas
    while (!evaluation.valid && attempts < 1) {
      const retryPrompt = `
Sos TutorIA, un tutor educativo institucional.

Pregunta del estudiante:
${question}

Tipo de actividad:
${activityType}

Regla pedagógica:
${pedagogicalInstruction}

La respuesta anterior fue rechazada por el Agente Evaluador.

Motivo:
${evaluation.reason}

Generá nuevamente la respuesta corrigiendo ese problema.

Cumplí estrictamente la regla pedagógica indicada.
`;

      response = await this.aiService.generate(retryPrompt);

      evaluation = this.evaluatorService.evaluate(
        question,
        response,
        activityType,
      );

      attempts++;
    }

    // 7. Guardar interacción
    await this.interactionsService.create(
      userId,
      subjectId,
      question,
      response,
      activityType,
      true,
    );

    // 8. Devolver resultado
    return {
      source: 'AI',
      usedAI: true,
      validated: evaluation.valid,
      validationReason: evaluation.reason ?? null,
      attempts,
      response,
    };
  }
}