import { Injectable } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AiService } from '../ai/ai.service';
import { ActivityType } from '../../generated/prisma/client';
import { PedagogicalService } from '../pedagogical/pedagogical.service';
import { EvaluatorService } from '../evaluator/evaluator.service';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class TutorService {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly interactionsService: InteractionsService,
    private readonly aiService: AiService,
    private readonly pedagogicalService: PedagogicalService,
    private readonly evaluatorService: EvaluatorService,
    private readonly progressService: ProgressService,
  ) {}

  async ask(
    userId: string,
    subjectId: string,
    question: string,
    activityType: ActivityType,
  ) {
    // 1. Buscar conocimiento local relevante
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
        usedMemory: false,
        memoryItems: 0,
        validated: true,
        validationReason: null,
        attempts: 0,
        response,
      };
    }

    // 2. Recuperar memoria reciente del alumno
    const history = await this.interactionsService.findRecentByUser(
      userId,
      5,
    );

    const historyContext = history
      .map(
        (item) => `
Pregunta anterior: ${item.question}
Respuesta anterior: ${item.response}
Tipo de actividad: ${item.activityType}
`,
      )
      .join('\n');

    // 3. Recuperar progreso académico
    const progress =
      await this.progressService.findByUserAndSubject(
        userId,
        subjectId,
      );

    const progressContext = progress
      .map(
        (item) =>
          `${item.topic}: dominio ${item.masteryLevel}% (${item.correctAnswers}/${item.attempts} respuestas correctas)`,
      )
      .join('\n');

    // 4. Obtener estrategia pedagógica
    const pedagogicalInstruction =
      this.pedagogicalService.getInstruction(activityType);

    // 5. Construir prompt
    const prompt = `
Sos TutorIA, un tutor educativo institucional.

Pregunta actual del estudiante:
${question}

Tipo de actividad:
${activityType}

Historial reciente del estudiante:
${historyContext || 'No existen interacciones anteriores.'}

Progreso académico registrado:
${progressContext || 'No existe progreso registrado.'}

Regla pedagógica:
${pedagogicalInstruction}

Utilizá el historial únicamente cuando sea relevante para adaptar la explicación.

Adaptá la dificultad según el progreso académico registrado.
Si el dominio del estudiante es bajo, utilizá explicaciones más simples y guiadas.
Si el dominio es alto, aumentá progresivamente la dificultad.

No inventes información sobre el estudiante.

Cumplí estrictamente la regla pedagógica indicada.
`;

    // 6. Consultar IA
    let response = await this.aiService.generate(prompt);

    // 7. Evaluar respuesta
    let evaluation = this.evaluatorService.evaluate(
      question,
      response,
      activityType,
    );

    let attempts = 0;

    // 8. Reintentar una vez si el evaluador rechaza la respuesta
    while (!evaluation.valid && attempts < 1) {
      const retryPrompt = `
Sos TutorIA, un tutor educativo institucional.

Pregunta actual del estudiante:
${question}

Tipo de actividad:
${activityType}

Historial reciente del estudiante:
${historyContext || 'No existen interacciones anteriores.'}

Progreso académico registrado:
${progressContext || 'No existe progreso registrado.'}

Regla pedagógica:
${pedagogicalInstruction}

La respuesta anterior fue rechazada por el Agente Evaluador.

Motivo:
${evaluation.reason}

Generá una nueva respuesta corrigiendo ese problema.

Adaptá la explicación al historial y progreso del estudiante cuando corresponda.

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

    // 9. Persistir interacción
    await this.interactionsService.create(
      userId,
      subjectId,
      question,
      response,
      activityType,
      true,
    );

    // 10. Devolver resultado
    return {
      source: 'AI',
      usedAI: true,
      usedMemory: history.length > 0 || progress.length > 0,
      memoryItems: history.length,
      progressItems: progress.length,
      validated: evaluation.valid,
      validationReason: evaluation.reason ?? null,
      attempts,
      response,
    };
  }
}