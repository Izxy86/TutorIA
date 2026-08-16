import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
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

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @Get('subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.knowledgeService.findBySubject(subjectId);
  }

  @UseGuards(JwtGuard)
  @Get('search/:subjectId')
  search(
    @Param('subjectId') subjectId: string,
    @Query('q') query: string,
  ) {
    return this.knowledgeService.search(subjectId, query);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @Patch(':id/validate')
  validate(@Param('id') id: string) {
    return this.knowledgeService.validate(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.knowledgeService.remove(id);
  }
}
