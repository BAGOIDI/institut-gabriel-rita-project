import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Student } from '../../entities/student.entity';
import { Class } from '../../entities/class.entity';
import { StudentController } from './students.controller';
import { StudentService } from './students.service';
import { StudentImportController } from './controllers/student.controller';
import { StudentService as StudentImportService } from './services/student.service';
import { StudentRepository } from './repositories/student.repository';
import { ExcelProvider } from './providers/excel.provider';

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
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [StudentController, StudentImportController],
  providers: [
    StudentService, 
    { provide: 'StudentImportService', useClass: StudentImportService },
    StudentRepository, 
    ExcelProvider
  ],
  exports: [StudentService]
})
export class StudentModule {}