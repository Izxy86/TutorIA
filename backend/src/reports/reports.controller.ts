import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
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

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @Get('teacher/:subjectId')
  getTeacherDashboard(
    @Param('subjectId') subjectId: string,
  ) {
    return this.reportsService.getTeacherDashboard(subjectId);
  }
}