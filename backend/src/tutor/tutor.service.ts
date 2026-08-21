import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AiService } from '../ai/ai.service';
import {
  ActivityType,
  KnowledgeSource,
} from '../../generated/prisma/client';
import { PedagogicalService } from '../pedagogical/pedagogical.service';
import { EvaluatorService } from '../evaluator/evaluator.service';
import { ProgressService } from '../progress/progress.service';
import { AnswerEvaluatorService } from '../answer-evaluator/answer-evaluator.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TutorService {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly interactionsService: InteractionsService,
    private readonly aiService: AiService,
    private readonly pedagogicalService: PedagogicalService,
    private readonly evaluatorService: EvaluatorService,
    private readonly progressService: ProgressService,
    private readonly answerEvaluatorService: AnswerEvaluatorService,
    private readonly prisma: PrismaService,
  ) {}

async ask(
  userId: string,
  subjectId: string,
  question: string,
  activityType: ActivityType,
) {
  /*
   * 0. Obtener materia seleccionada.
   */
  const subject =
    await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

  if (!subject) {
    throw new NotFoundException(
      'La materia seleccionada no existe.',
    );
  }

  /*
   * 1. Validar si la pregunta corresponde
   * a la materia seleccionada.
   */
  const questionIsRelevant =
    await this.isRelevantToSubject(
      subject.name,
      question,
    );

  /*
   * Si está fuera de materia, no seguimos.
   */
  if (!questionIsRelevant) {
    const response =
      `Esta consulta no corresponde a la materia ${subject.name}. ` +
      `TutorIA solo puede ayudarte con contenidos relacionados con esa materia.`;

    await this.interactionsService.create(
      userId,
      subjectId,
      question,
      response,
      activityType,
      false,
    );

    return {
      source: 'FILTER',
      usedAI: false,
      cached: false,
      savedToKnowledge: false,
      usedMemory: false,
      memoryItems: 0,
      progressItems: 0,
      validated: true,
      validationReason: null,
      attempts: 0,
      hasPendingExercise: false,
      response,
      suspectedEvasion: false,
      needsHelp: false,
    };
  }

  /*
   * 2. Buscar conocimiento local.
   *
   * En PRACTICE/EXAM no devolvemos directamente
   * conocimiento local porque podría revelar
   * la solución sin aplicar estrategia pedagógica.
   */
  const canRespondDirectlyFromLocal =
    activityType === ActivityType.LEARNING ||
    activityType === ActivityType.REVIEW;

  if (canRespondDirectlyFromLocal) {
    const localResults =
      await this.knowledgeService.findRelevant(
        subjectId,
        question,
      );

    if (localResults.length > 0) {
      const item = localResults[0];

      /*
       * La pregunta ya fue validada contra la materia,
       * así que podemos utilizar el resultado local.
       */
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
        source:
          item.source === KnowledgeSource.AI
            ? 'AI_CACHE'
            : 'LOCAL',

        usedAI: false,

        cached:
          item.source === KnowledgeSource.AI,

        savedToKnowledge: false,

        usedMemory: false,
        memoryItems: 0,
        progressItems: 0,

        validated: true,
        validationReason: null,

        attempts: 0,
        hasPendingExercise: false,

        response,

        suspectedEvasion: false,
        needsHelp: false,
      };
    }
  }

  /*
   * 3. Recuperar memoria reciente
   * SOLO de la materia seleccionada.
   */
  const history =
    await this.interactionsService.findRecentByUser(
      userId,
      subjectId,
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

  /*
   * 4. Recuperar progreso
   * SOLO de la materia seleccionada.
   */
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

  /*
   * 5. Estrategia pedagógica.
   */
  const pedagogicalInstruction =
    this.pedagogicalService.getInstruction(
      activityType,
    );

  /*
   * 6. Prompt principal.
   */
  const prompt = `
Sos TutorIA, un tutor educativo institucional.

Materia seleccionada:
${subject.name}

Tu ámbito de respuesta está limitado exclusivamente a contenidos relacionados con la materia seleccionada.

Pregunta actual del estudiante:
${question}

Tipo de actividad:
${activityType}

Historial reciente del estudiante dentro de ${subject.name}:
${historyContext || 'No existen interacciones anteriores.'}

Progreso académico registrado en ${subject.name}:
${progressContext || 'No existe progreso registrado.'}

Regla pedagógica:
${pedagogicalInstruction}

Utilizá el historial únicamente cuando sea relevante para la pregunta actual.

No mezcles contenidos pertenecientes a otras materias.

Adaptá la dificultad según el progreso académico registrado.

Si el dominio es bajo, utilizá explicaciones más simples y guiadas.

Si el dominio es alto, aumentá progresivamente la dificultad.

No inventes información sobre el estudiante.

Cumplí estrictamente la regla pedagógica indicada.

Recordá: sos un tutor de ${subject.name}, no un asistente general.
`;

  /*
   * 7. Consultar IA.
   */
  let response =
    await this.aiService.generate(prompt);

  /*
   * 8. Evaluar respuesta de TutorIA.
   */
  let evaluation =
    this.evaluatorService.evaluate(
      question,
      response,
      activityType,
    );

  let attempts = 0;

  /*
   * 9. Un reintento si el evaluador rechaza.
   */
  while (
    !evaluation.valid &&
    attempts < 1
  ) {
    const retryPrompt = `
Sos TutorIA, un tutor educativo institucional.

Materia seleccionada:
${subject.name}

Solo podés responder consultas relacionadas con ${subject.name}.

Pregunta actual:
${question}

Tipo de actividad:
${activityType}

Historial reciente de ${subject.name}:
${historyContext || 'No existen interacciones anteriores.'}

Progreso en ${subject.name}:
${progressContext || 'No existe progreso registrado.'}

Regla pedagógica:
${pedagogicalInstruction}

La respuesta anterior fue rechazada.

Motivo:
${evaluation.reason}

Generá una nueva respuesta corrigiendo ese problema.

No mezcles información de otras materias.

Cumplí estrictamente la regla pedagógica indicada.
`;

    response =
      await this.aiService.generate(
        retryPrompt,
      );

    evaluation =
      this.evaluatorService.evaluate(
        question,
        response,
        activityType,
      );

    attempts++;
  }

  /*
   * 10. Guardar interacción.
   */
  await this.interactionsService.createWithEvaluation(
    userId,
    subjectId,
    question,
    response,
    activityType,
    true,
    evaluation.suspectedEvasion,
    evaluation.needsHelp,
    evaluation.reason,
  );

  /*
   * 11. Cache de conocimiento.
   *
   * Solo LEARNING validado y relevante
   * para la materia seleccionada.
   */
  let savedToKnowledge = false;

  if (
    evaluation.valid &&
    activityType === ActivityType.LEARNING
  ) {
    const responseIsRelevant =
      await this.isRelevantToSubject(
        subject.name,
        question,
      );

    if (responseIsRelevant) {
      await this.knowledgeService.saveFromAI(
        subjectId,
        question,
        response,
      );

      savedToKnowledge = true;
    }
  }

  /*
   * 12. Si es práctica, obtener internamente
   * tema + respuesta esperada y persistirlos.
   */
  let hasPendingExercise = false;

  if (
    evaluation.valid &&
    activityType === ActivityType.PRACTICE
  ) {
    const exercise =
      await this.extractExerciseData(
        question,
        response,
      );

    if (
      exercise?.topic &&
      exercise?.expectedAnswer
    ) {
      await this.prisma.pendingExercise.deleteMany({
        where: {
          userId,
          subjectId,
        },
      });

      await this.prisma.pendingExercise.create({
        data: {
          userId,
          subjectId,

          question:
            exercise.question ||
            question,

          topic: exercise.topic,

          expectedAnswer:
            exercise.expectedAnswer,
        },
      });

      hasPendingExercise = true;
    }
  }

  return {
    source: 'AI',

    usedAI: true,

    cached: false,

    savedToKnowledge,

    usedMemory:
      history.length > 0 ||
      progress.length > 0,

    memoryItems: history.length,

    progressItems: progress.length,

    validated: evaluation.valid,

    validationReason:
      evaluation.reason ?? null,

    attempts,

    hasPendingExercise,

    response,

    suspectedEvasion:
      evaluation.suspectedEvasion,

    needsHelp:
      evaluation.needsHelp,
  };
}

  /*
   * Evalúa la respuesta del alumno.
   *
   * Ya NO recibe expectedAnswer ni topic
   * desde el frontend.
   */
  async evaluateAnswer(
    userId: string,
    subjectId: string,
    answer: string,
  ) {
    const exercise =
      await this.prisma.pendingExercise.findFirst({
        where: {
          userId,
          subjectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!exercise) {
      throw new NotFoundException(
        'No existe un ejercicio pendiente para evaluar.',
      );
    }

    const evaluation =
      await this.answerEvaluatorService.evaluate(
        exercise.question,
        answer,
        exercise.expectedAnswer,
      );

      console.log({
  userId,
  subjectId,
  exerciseSubjectId: exercise.subjectId,
  topic: exercise.topic,
})

    const progress =
      await this.progressService.updateProgress(
        userId,
        subjectId,
        exercise.topic,
        evaluation.correct,
      );

    /*
     * Si respondió correctamente,
     * damos el ejercicio por terminado.
     *
     * Si fue incorrecto permanece disponible
     * para permitir otro intento.
     */
    if (evaluation.correct) {
      await this.prisma.pendingExercise.delete({
        where: {
          id: exercise.id,
        },
      });
    }

    return {
      correct: evaluation.correct,
      feedback: evaluation.feedback,
      usedAI: evaluation.usedAI,
      topic: exercise.topic,
      progress,
    };
  }

  /*
   * Extrae datos privados del ejercicio.
   *
   * Estos datos nunca llegan al frontend.
   */
  private async extractExerciseData(
    studentQuestion: string,
    tutorResponse: string,
  ): Promise<{
    question: string;
    topic: string;
    expectedAnswer: string;
  } | null> {
    const prompt = `
Analizá la siguiente interacción educativa.

Pedido del estudiante:
${studentQuestion}

Respuesta del tutor:
${tutorResponse}

Si la respuesta del tutor contiene un ejercicio concreto que el estudiante debe resolver, identificá:

- la pregunta concreta del ejercicio;
- el tema;
- la respuesta correcta esperada.

Respondé EXCLUSIVAMENTE JSON válido.

Formato:

{
  "question": "pregunta concreta",
  "topic": "tema académico",
  "expectedAnswer": "respuesta correcta"
}

Si no existe un ejercicio concreto con una respuesta evaluable, respondé:

{
  "question": "",
  "topic": "",
  "expectedAnswer": ""
}
`;

    try {
      const raw =
        await this.aiService.generate(prompt);

      const cleaned = raw
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (
        typeof parsed.question !== 'string' ||
        typeof parsed.topic !== 'string' ||
        typeof parsed.expectedAnswer !== 'string'
      ) {
        return null;
      }

      if (
        !parsed.topic.trim() ||
        !parsed.expectedAnswer.trim()
      ) {
        return null;
      }

      return {
        question:
          parsed.question.trim(),
        topic:
          parsed.topic.trim(),
        expectedAnswer:
          parsed.expectedAnswer.trim(),
      };
    } catch {
      return null;
    }
  }

  private async isRelevantToSubject(
  subjectName: string,
  question: string,
): Promise<boolean> {
  const prompt = `
Determiná si la siguiente pregunta pertenece razonablemente a la materia indicada.

Materia:
${subjectName}

Pregunta:
${question}

Respondé exclusivamente:
true
o
false
`;

  const result = await this.aiService.generate(prompt);

  return result.trim().toLowerCase().startsWith('true');
}
}