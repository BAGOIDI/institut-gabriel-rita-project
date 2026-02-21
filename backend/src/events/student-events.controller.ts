import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { LmsService } from '../external/lms.service';
import { SnipeITService } from '../external/snipeit.service';

@Controller()
export class StudentEventsController {
  constructor(
    private lms: LmsService,
    private snipeit: SnipeITService
  ) {}

  @EventPattern('student.created')
  async handleStudentCreated(@Payload() student: any) {
    console.log(`⚡ Worker received: Create external accounts for ${student.email}`);
    
    // C'est ici que le travail lourd se fait, en arrière-plan
    try {
      // 1. Création LMS (Chamilo)
      await this.lms.getCourses(student.email); // (Simulation création)
      console.log('✅ LMS Account Created');

      // 2. Création Snipe-IT
      await this.snipeit.getMyAssets(student.email); // (Simulation création)
      console.log('✅ Snipe-IT Account Created');
      
      // TODO: Mettre à jour le statut de l'étudiant à 'ACTIVE' dans la DB
      
    } catch (e) {
      console.error('❌ Error processing student creation', e);
      // RabbitMQ réessaiera automatiquement si on configure les acks
    }
  }
}
