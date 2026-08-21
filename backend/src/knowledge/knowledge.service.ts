import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeSource } from '../../generated/prisma/client';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    subjectId: string,
    title: string,
    content: string,
    topic?: string,
  ) {
    const normalizedTitle = title.trim();

    const existing =
      await this.prisma.knowledgeItem.findFirst({
        where: {
          subjectId,
          source: KnowledgeSource.TEACHER,
          title: {
            equals: normalizedTitle,
            mode: 'insensitive',
          },
        },
      });

    if (existing) {
      throw new ConflictException(
        'Ya existe material docente con ese título.',
      );
    }

    return this.prisma.knowledgeItem.create({
      data: {
        subjectId,
        title: normalizedTitle,
        content: content.trim(),
        topic: topic?.trim() || null,
        source: KnowledgeSource.TEACHER,
        validated: true,
      },
    });
  }

  async saveFromAI(
    subjectId: string,
    question: string,
    content: string,
  ) {
    const normalizedQuestion = question.trim();

    const existing =
      await this.prisma.knowledgeItem.findFirst({
        where: {
          subjectId,
          source: KnowledgeSource.AI,
          title: {
            equals: normalizedQuestion,
            mode: 'insensitive',
          },
        },
      });

    if (existing) {
      return this.prisma.knowledgeItem.update({
        where: {
          id: existing.id,
        },
        data: {
          content: content.trim(),
          validated: true,
        },
      });
    }

    return this.prisma.knowledgeItem.create({
      data: {
        subjectId,
        title: normalizedQuestion,
        content: content.trim(),
        source: KnowledgeSource.AI,
        validated: true,
      },
    });
  }

  findBySubject(subjectId: string) {
    return this.prisma.knowledgeItem.findMany({
      where: {
        subjectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  search(subjectId: string, text: string) {
    return this.prisma.knowledgeItem.findMany({
      where: {
        subjectId,
        AND: [
          {
            OR: [
              {
                source: KnowledgeSource.TEACHER,
              },
              {
                source: KnowledgeSource.AI,
                validated: true,
              },
            ],
          },
          {
            OR: [
              {
                title: {
                  contains: text,
                  mode: 'insensitive',
                },
              },
              {
                topic: {
                  contains: text,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: text,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
    });
  }

  async findRelevant(
  subjectId: string,
  question: string,
) {
  const stopWords = new Set([
    'quien',
    'quién',
    'como',
    'cómo',
    'donde',
    'dónde',
    'cuando',
    'cuándo',
    'porque',
    'porqué',
    'cual',
    'cuál',
    'sobre',
    'explica',
    'explicame',
    'explícame',
    'quiero',
    'saber',
  ]);

  const words = question
    .toLowerCase()
    .replace(/[¿?¡!.,]/g, '')
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        !stopWords.has(word),
    );

  if (words.length === 0) {
    return [];
  }

  return this.prisma.knowledgeItem.findMany({
    where: {
      subjectId,
      AND: [
        {
          OR: [
            {
              source: KnowledgeSource.TEACHER,
            },
            {
              source: KnowledgeSource.AI,
              validated: true,
            },
          ],
        },
        {
          OR: words.flatMap((word) => [
            {
              title: {
                contains: word,
                mode: 'insensitive' as const,
              },
            },
            {
              topic: {
                contains: word,
                mode: 'insensitive' as const,
              },
            },
          ]),
        },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });
}

  async validate(id: string) {
  return this.prisma.knowledgeItem.update({
    where: { id },
    data: {
      validated: true,
    },
  });
}

async remove(id: string) {
  return this.prisma.knowledgeItem.delete({
    where: { id },
  });
}
}