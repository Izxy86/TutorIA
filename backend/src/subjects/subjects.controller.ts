import { Body, Controller, Get, Post } from '@nestjs/common';
import { SubjectsService } from './subjects.service';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(@Body('name') name: string) {
    return this.subjectsService.create(name);
  }

  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }
}
