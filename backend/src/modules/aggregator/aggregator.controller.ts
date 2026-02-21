import { Controller, Get, Query } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';

@Controller('dashboard')
export class AggregatorController {
  constructor(private readonly aggregator: AggregatorService) {}

  @Get()
  async getDashboard(@Query('email') email: string) {
    return this.aggregator.getStudentDashboard(email || 'student@school.com');
  }
}
