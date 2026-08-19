import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está definida');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error: any) {
        const is503 = error?.status === 503;

        if (!is503 || attempt === maxRetries) {
          throw error;
        }

        const delay = 1500 * (attempt + 1);

        console.warn(
          `Gemini 503. Reintento ${attempt + 1}/${maxRetries} en ${delay}ms...`,
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay),
        );
      }
    }

    throw new Error('No se pudo obtener respuesta de Gemini');
  }
}