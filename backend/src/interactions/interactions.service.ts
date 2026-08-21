import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from '../../generated/prisma/client';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: string,
    subjectId: string,
    question: string,
    response: string,
    activityType: ActivityType,
    usedAI = false,
  ) {
    return this.prisma.interaction.create({
      data: {
        userId,
        subjectId,
        question,
        response,
        activityType,
        usedAI,
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.interaction.findMany({
      where: { userId },
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

findRecentByUser(
  userId: string,
  subjectId: string,
  limit = 5,
) {
  return this.prisma.interaction.findMany({
    where: {
      userId,
      subjectId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

createWithEvaluation(
  userId: string,
  subjectId: string,
  question: string,
  response: string,
  activityType: ActivityType,
  usedAI: boolean,
  suspectedEvasion: boolean,
  needsHelp: boolean,
  feedback?: string,
) {
  return this.prisma.interaction.create({
    data: {
      userId,
      subjectId,
      question,
      response,
      activityType,
      usedAI,
      evaluation: {
        create: {
          userId,
          suspectedEvasion,
          needsHelp,
          feedback,
        },
      },
    },
    include: {
      evaluation: true,
    },
  });
}
}
