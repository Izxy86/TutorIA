import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TutorService } from './tutor.service';
import {
  ActivityType,
  UserRole,
} from '../../generated/prisma/client';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

@Controller('tutor')
export class TutorController {
  constructor(
    private readonly tutorService: TutorService,
  ) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('ask')
  ask(
    @Req() request: AuthenticatedRequest,
    @Body('subjectId') subjectId: string,
    @Body('question') question: string,
    @Body('activityType') activityType: ActivityType,
  ) {
    return this.tutorService.ask(
      request.user.sub,
      subjectId,
      question,
      activityType,
    );
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('evaluate')
  evaluate(
    @Req() request: AuthenticatedRequest,
    @Body('subjectId') subjectId: string,
    @Body('answer') answer: string,
  ) {
    return this.tutorService.evaluateAnswer(
      request.user.sub,
      subjectId,
      answer,
    );
  }
}