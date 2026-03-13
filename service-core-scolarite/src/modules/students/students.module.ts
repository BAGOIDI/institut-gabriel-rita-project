import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './students.service';
import { StudentController } from './students.controller';
import { Student } from '../../entities/student.entity';
import { Class } from '../../entities/class.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Class]),
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
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
