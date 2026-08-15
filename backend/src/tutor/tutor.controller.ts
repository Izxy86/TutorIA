import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TutorService } from './tutor.service';
import {
  ActivityType,
  UserRole,
} from '../../generated/prisma/client';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';

@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('ask')
  ask(
    @Body('userId') userId: string,
    @Body('subjectId') subjectId: string,
    @Body('question') question: string,
    @Body('activityType') activityType: ActivityType,
  ) {
    return this.tutorService.ask(
      userId,
      subjectId,
      question,
      activityType,
    );
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('evaluate')
  evaluate(
    @Body('userId') userId: string,
    @Body('subjectId') subjectId: string,
    @Body('topic') topic: string,
    @Body('answer') answer: string,
    @Body('expectedAnswer') expectedAnswer: string,
  ) {
    return this.tutorService.evaluateAnswer(
      userId,
      subjectId,
      topic,
      answer,
      expectedAnswer,
    );
  }
}