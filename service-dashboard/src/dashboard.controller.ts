import { Controller, Get, Query } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DashboardService } from './dashboard.service';
import { EventsGateway } from './dashboard/events.gateway';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // GET /dashboard/stats — Données complètes pour le frontend Dashboard.tsx
  @Get('stats')
  async getStats(@Query('period') period = 'month') {
    return this.dashboardService.getStats(period);
  }

  // GET /dashboard/summary — Route legacy
  @Get('summary')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  // --- RABBITMQ LISTENERS ---
  @EventPattern('payment_created')
  async handlePaymentCreated(@Payload() data: any) {
    this.eventsGateway.broadcast('payment_update', data);
  }

  @EventPattern('attendance_logged')
  async handleAttendance(@Payload() data: any) {
    this.eventsGateway.broadcast('attendance_update', data);
  }

  @EventPattern('student.created')
  async handleStudentCreated(@Payload() data: any) {
    this.eventsGateway.broadcast('student_update', data);
  }

  @EventPattern('student.updated')
  async handleStudentUpdated(@Payload() data: any) {
    this.eventsGateway.broadcast('student_update', data);
  }
}
