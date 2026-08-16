import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AnswerEvaluatorService {
  constructor(
    private readonly aiService: AiService,
  ) {}

  async evaluate(
    question: string,
    studentAnswer: string,
    expectedAnswer: string,
  ) {
    const normalizedStudent =
      studentAnswer.trim().toLowerCase();

    const normalizedExpected =
      expectedAnswer.trim().toLowerCase();

    // Caso simple: coincidencia exacta
    if (
      normalizedStudent ===
      normalizedExpected
    ) {
      return {
        correct: true,
        feedback:
          'Respuesta correcta.',
        usedAI: false,
      };
    }

    // Caso conceptual: usar IA
    const prompt = `
Evaluá la respuesta de un estudiante.

Pregunta:
${question}

Respuesta esperada:
${expectedAnswer}

Respuesta del estudiante:
${studentAnswer}

Determiná si la respuesta del estudiante es conceptualmente correcta.

Respondé exclusivamente en JSON válido con esta estructura:

{
  "correct": true o false,
  "feedback": "explicación breve"
}
`;

    const result =
      await this.aiService.generate(prompt);

    try {
      const parsed = JSON.parse(
        result
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim(),
      );

      return {
        correct:
          parsed.correct === true,
        feedback:
          parsed.feedback ??
          'Evaluación completada.',
        usedAI: true,
      };
    } catch {
      return {
        correct: false,
        feedback:
          'No fue posible evaluar la respuesta automáticamente.',
        usedAI: true,
      };
    }
  }
}
