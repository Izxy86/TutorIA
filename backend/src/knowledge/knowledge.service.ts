import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    subjectId: string,
    title: string,
    content: string,
    topic?: string,
  ) {
    return this.prisma.knowledgeItem.create({
      data: {
        subjectId,
        title,
        content,
        topic,
      },
    });
  }

  findBySubject(subjectId: string) {
    return this.prisma.knowledgeItem.findMany({
      where: { subjectId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  search(subjectId: string, text: string) {
    return this.prisma.knowledgeItem.findMany({
      where: {
        subjectId,
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
    });
  }
}