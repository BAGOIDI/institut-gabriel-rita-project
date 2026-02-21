import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) {}

  async register(data: any) {
    // 1. Sauvegarde locale (Rapide)
    const student = await this.studentRepo.save({
      ...data,
      status: 'PENDING_SYNC' // On marque que la synchro est en cours
    });

    // 2. Envoi du message au Broker (Asynchrone)
    // On n'attend pas la réponse des services externes !
    this.client.emit('student.created', student);
    console.log(`🐰 Event 'student.created' sent for ${student.email}`);

    return student;
  }
}
