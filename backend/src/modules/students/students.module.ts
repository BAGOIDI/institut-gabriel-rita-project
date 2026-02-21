import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Student } from './student.entity';
import { StudentsService } from './students.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
          queue: 'school_events',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
