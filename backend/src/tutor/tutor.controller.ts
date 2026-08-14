import { Body, Controller, Post } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { ActivityType } from '../../generated/prisma/client';

@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

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
}
