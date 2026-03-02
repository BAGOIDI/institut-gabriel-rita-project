import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DashboardService } from './dashboard.service';
import { EventsGateway } from './events.gateway';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly eventsGateway: EventsGateway
  ) {}

  @Get('summary')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  // --- RABBITMQ LISTENERS ---
  // These receive messages from other microservices and push them to Frontend via WebSocket

  @EventPattern('payment_created')
  async handlePaymentCreated(@Payload() data: any) {
    console.log('RabbitMQ -> WebSocket: Payment', data);
    this.eventsGateway.broadcast('payment_update', data);
  }

  @EventPattern('attendance_logged')
  async handleAttendance(@Payload() data: any) {
    console.log('RabbitMQ -> WebSocket: Attendance', data);
    this.eventsGateway.broadcast('attendance_update', data);
  }
}