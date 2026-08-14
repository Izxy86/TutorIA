import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentReport(userId: string, subjectId: string) {
    const [user, subject, progress, interactions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
      }),

      this.prisma.subject.findUnique({
        where: { id: subjectId },
      }),

      this.prisma.studentProgress.findMany({
        where: {
          userId,
          subjectId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),

      this.prisma.interaction.findMany({
        where: {
          userId,
          subjectId,
        },
        include: {
          evaluation: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalInteractions = interactions.length;

    const aiInteractions = interactions.filter(
      (interaction) => interaction.usedAI,
    ).length;

    const localInteractions = totalInteractions - aiInteractions;

    const evasions = interactions.filter(
      (interaction) =>
        interaction.evaluation?.suspectedEvasion === true,
    ).length;

    const helpRequests = interactions.filter(
      (interaction) =>
        interaction.evaluation?.needsHelp === true,
    ).length;

    const averageMastery =
      progress.length > 0
        ? Math.round(
            progress.reduce(
              (total, item) => total + item.masteryLevel,
              0,
            ) / progress.length,
          )
        : 0;

    const topicsNeedingReinforcement = progress
      .filter((item) => item.masteryLevel < 60)
      .map((item) => ({
        topic: item.topic,
        masteryLevel: item.masteryLevel,
      }));

    return {
      student: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        : null,

      subject: subject
        ? {
            id: subject.id,
            name: subject.name,
          }
        : null,

      summary: {
        totalInteractions,
        aiInteractions,
        localInteractions,
        evasions,
        helpRequests,
        averageMastery,
      },

      alerts: {
        needsAttention:
          topicsNeedingReinforcement.length > 0 ||
          evasions >= 3 ||
          helpRequests >= 3,

        reasons: [
          ...(topicsNeedingReinforcement.length > 0
            ? ['Existen temas con dominio inferior al 60%.']
            : []),

          ...(evasions >= 3
            ? ['Se detectaron múltiples intentos de evasión.']
            : []),

          ...(helpRequests >= 3
            ? ['El estudiante solicitó ayuda reiteradamente.']
            : []),
        ],
      },

      progress,

      topicsNeedingReinforcement,

      recentInteractions: interactions.slice(0, 5).map(
        (interaction) => ({
          question: interaction.question,
          activityType: interaction.activityType,
          usedAI: interaction.usedAI,
          createdAt: interaction.createdAt,
          suspectedEvasion:
            interaction.evaluation?.suspectedEvasion ?? false,
          needsHelp:
            interaction.evaluation?.needsHelp ?? false,
        }),
      ),
    };
  }

  async getTeacherDashboard(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    const students = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          {
            progress: {
              some: {
                subjectId,
              },
            },
          },
          {
            interactions: {
              some: {
                subjectId,
              },
            },
          },
        ],
      },
    });

    const studentSummaries = await Promise.all(
      students.map(async (student) => {
        const [progress, interactions] = await Promise.all([
          this.prisma.studentProgress.findMany({
            where: {
              userId: student.id,
              subjectId,
            },
          }),

          this.prisma.interaction.findMany({
            where: {
              userId: student.id,
              subjectId,
            },
            include: {
              evaluation: true,
            },
          }),
        ]);

        const averageMastery =
          progress.length > 0
            ? Math.round(
                progress.reduce(
                  (total, item) => total + item.masteryLevel,
                  0,
                ) / progress.length,
              )
            : 0;

        const evasions = interactions.filter(
          (interaction) =>
            interaction.evaluation?.suspectedEvasion === true,
        ).length;

        const helpRequests = interactions.filter(
          (interaction) =>
            interaction.evaluation?.needsHelp === true,
        ).length;

        const weakTopics = progress.filter(
          (item) => item.masteryLevel < 60,
        );

        const needsAttention =
          weakTopics.length > 0 ||
          evasions >= 3 ||
          helpRequests >= 3;

        return {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
          },

          averageMastery,

          totalInteractions: interactions.length,

          evasions,

          helpRequests,

          weakTopics: weakTopics.map((item) => ({
            topic: item.topic,
            masteryLevel: item.masteryLevel,
          })),

          needsAttention,
        };
      }),
    );

    return {
      subject: subject
        ? {
            id: subject.id,
            name: subject.name,
          }
        : null,

      summary: {
        totalStudents: studentSummaries.length,
        studentsNeedingAttention: studentSummaries.filter(
          (student) => student.needsAttention,
        ).length,
      },

      students: studentSummaries.sort(
        (a, b) =>
          Number(b.needsAttention) -
          Number(a.needsAttention),
      ),
    };
  }
}