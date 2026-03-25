import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DashboardService } from './dashboard.service';
import { EventsGateway } from './events.gateway';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /** GET /api/dashboard/dashboard/summary — health check */
  @Get('summary')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  /** GET /api/dashboard/dashboard/stats — full dashboard payload */
  @Get('stats')
  async getStats() {
    return this.dashboardService.getFullStats();
  }

  // ─── RabbitMQ listeners → WebSocket broadcast ──────────────────────────
  @EventPattern('payment_created')
  async handlePaymentCreated(@Payload() data: any) {
    this.eventsGateway.broadcast('payment_update', data);
  }

  @EventPattern('payment_updated')
  async handlePaymentUpdated(@Payload() data: any) {
    this.eventsGateway.broadcast('payment_update', data);
  }

  @EventPattern('payment_deleted')
  async handlePaymentDeleted(@Payload() data: any) {
    this.eventsGateway.broadcast('payment_update', data);
  }

  @EventPattern('disbursement_created')
  async handleDisbursementCreated(@Payload() data: any) {
    this.eventsGateway.broadcast('disbursement_update', data);
  }

  @EventPattern('attendance_logged')
  async handleAttendance(@Payload() data: any) {
    this.eventsGateway.broadcast('attendance_update', data);
  }

  @EventPattern('student_enrolled')
  async handleStudentEnrolled(@Payload() data: any) {
    this.eventsGateway.broadcast('stats_refresh', { trigger: 'student_enrolled', data });
  }
}
