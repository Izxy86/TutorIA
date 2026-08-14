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

  findRecentByUser(userId: string, limit = 5) {
  return this.prisma.interaction.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}
}
