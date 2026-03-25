import { Controller, Get, Post } from '@nestjs/common';
import { ClientProxy, MessagePattern, EventPattern } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Controller('api/rabbitmq')
export class RabbitMQTestController {
  constructor(@Inject('RABBITMQ_SERVICE') private client: ClientProxy) {}

  /**
   * Tester l'envoi d'un événement student.created
   */
  @Post('test/student-created')
  async testStudentCreated() {
    const testStudent = {
      id: 999,
      first_name: 'Test',
      last_name: 'Student',
      email: `test.student.${Date.now()}@example.com`,
      status: 'ACTIVE',
    };

    console.log('📤 Sending test event: student.created', testStudent);
    this.client.emit('student.created', testStudent);

    return {
      success: true,
      message: 'Event student.created sent',
      data: testStudent,
    };
  }

  /**
   * Tester l'envoi d'un événement teacher.created
   */
  @Post('test/teacher-created')
  async testTeacherCreated() {
    const testTeacher = {
      id: 999,
      firstName: 'Test',
      lastName: 'Teacher',
      email: `test.teacher.${Date.now()}@example.com`,
      phoneNumber: '+1234567890',
      specialty: 'Informatique',
      contractType: 'TEACHING',
      status: 'ACTIVE',
    };

    console.log('📤 Sending test event: teacher.created', testTeacher);
    this.client.emit('teacher.created', testTeacher);

    return {
      success: true,
      message: 'Event teacher.created sent',
      data: testTeacher,
    };
  }

  /**
   * Tester tous les événements
   */
  @Post('test/all')
  async testAllEvents() {
    await this.testStudentCreated();
    await this.testTeacherCreated();

    return {
      success: true,
      message: 'All test events sent successfully',
    };
  }

  /**
   * Vérifier la connexion RabbitMQ
   */
  @Get('health')
  async checkRabbitMQHealth() {
    try {
      // Essayer d'émettre un événement de test
      this.client.emit('ping', { timestamp: new Date().toISOString() });
      
      return {
        service: 'rabbitmq',
        healthy: true,
        connected: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: 'rabbitmq',
        healthy: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
