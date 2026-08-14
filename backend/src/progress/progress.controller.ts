import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get(':userId/:subjectId')
  findByUserAndSubject(
    @Param('userId') userId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.progressService.findByUserAndSubject(
      userId,
      subjectId,
    );
  }

  @Post()
  updateProgress(
    @Body('userId') userId: string,
    @Body('subjectId') subjectId: string,
    @Body('topic') topic: string,
    @Body('correct') correct: boolean,
  ) {
    return this.progressService.updateProgress(
      userId,
      subjectId,
      topic,
      correct,
    );
  }
}
