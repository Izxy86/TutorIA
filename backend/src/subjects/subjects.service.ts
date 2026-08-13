import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(name: string) {
    return this.prisma.subject.create({
      data: { name },
    });
  }

  findAll() {
    return this.prisma.subject.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}