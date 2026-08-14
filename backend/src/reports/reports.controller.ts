import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('student/:userId/:subjectId')
  getStudentReport(
    @Param('userId') userId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.reportsService.getStudentReport(
      userId,
      subjectId,
    );
  }

  @Get('teacher/:subjectId')
  getTeacherDashboard(
    @Param('subjectId') subjectId: string,
  ) {
    return this.reportsService.getTeacherDashboard(subjectId);
  }
}