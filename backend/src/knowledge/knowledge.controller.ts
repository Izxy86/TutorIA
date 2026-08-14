import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  create(
    @Body('subjectId') subjectId: string,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('topic') topic?: string,
  ) {
    return this.knowledgeService.create(
      subjectId,
      title,
      content,
      topic,
    );
  }

  @Get('subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.knowledgeService.findBySubject(subjectId);
  }

  @Get('search/:subjectId')
  search(
    @Param('subjectId') subjectId: string,
    @Query('q') query: string,
  ) {
    return this.knowledgeService.search(subjectId, query);
  }
}
