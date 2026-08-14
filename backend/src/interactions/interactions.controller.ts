import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { ActivityType } from '../../generated/prisma/client';

@Controller('interactions')
export class InteractionsController {
  constructor(
    private readonly interactionsService: InteractionsService,
  ) {}

  @Post()
  create(
    @Body('userId') userId: string,
    @Body('subjectId') subjectId: string,
    @Body('question') question: string,
    @Body('response') response: string,
    @Body('activityType') activityType: ActivityType,
    @Body('usedAI') usedAI: boolean,
  ) {
    return this.interactionsService.create(
      userId,
      subjectId,
      question,
      response,
      activityType,
      usedAI,
    );
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.interactionsService.findByUser(userId);
  }
}
