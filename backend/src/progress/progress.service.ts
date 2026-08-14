import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  findByUserAndSubject(userId: string, subjectId: string) {
    return this.prisma.studentProgress.findMany({
      where: {
        userId,
        subjectId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findByTopic(userId: string, subjectId: string, topic: string) {
    return this.prisma.studentProgress.findFirst({
      where: {
        userId,
        subjectId,
        topic,
      },
    });
  }

  async updateProgress(
    userId: string,
    subjectId: string,
    topic: string,
    correct: boolean,
  ) {
    const progress = await this.findByTopic(
      userId,
      subjectId,
      topic,
    );

    if (!progress) {
      return this.prisma.studentProgress.create({
        data: {
          userId,
          subjectId,
          topic,
          attempts: 1,
          correctAnswers: correct ? 1 : 0,
          masteryLevel: correct ? 100 : 0,
        },
      });
    }

    const attempts = progress.attempts + 1;
    const correctAnswers =
      progress.correctAnswers + (correct ? 1 : 0);

    const masteryLevel = Math.round(
      (correctAnswers / attempts) * 100,
    );

    return this.prisma.studentProgress.update({
      where: {
        id: progress.id,
      },
      data: {
        attempts,
        correctAnswers,
        masteryLevel,
      },
    });
  }
}
