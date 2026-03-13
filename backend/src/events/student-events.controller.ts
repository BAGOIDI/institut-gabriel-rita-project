import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { LmsService } from '../external/lms.service';
import { SnipeITService } from '../external/snipeit.service';
import { SearchIndexerService } from '../search-indexer.service';

@Controller()
export class StudentEventsController {
  constructor(
    private lms: LmsService,
    private snipeit: SnipeITService,
    private searchIndexer: SearchIndexerService,
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
      
      // 3. Indexation dans Typesense
      await this.searchIndexer.upsertStudent(student);
      console.log('✅ Typesense Index Updated');
      
      // TODO: Mettre à jour le statut de l'étudiant à 'ACTIVE' dans la DB
      
    } catch (e) {
      console.error('❌ Error processing student creation', e);
      // RabbitMQ réessaiera automatiquement si on configure les acks
    }
  }

  @EventPattern('teacher.created')
  async handleTeacherCreated(@Payload() staff: any) {
    console.log(`⚡ Worker received: Index teacher ${staff.email || staff.phoneNumber}`);
    try {
      await this.searchIndexer.upsertTeacher(staff);
      console.log('✅ Typesense Teacher Index Updated (created)');
    } catch (e) {
      console.error('❌ Error indexing teacher (created)', e);
    }
  }

  @EventPattern('teacher.updated')
  async handleTeacherUpdated(@Payload() staff: any) {
    console.log(`⚡ Worker received: Re-index teacher ${staff.email || staff.phoneNumber}`);
    try {
      await this.searchIndexer.upsertTeacher(staff);
      console.log('✅ Typesense Teacher Index Updated (updated)');
    } catch (e) {
      console.error('❌ Error indexing teacher (updated)', e);
    }
  }

  @EventPattern('teacher.deleted')
  async handleTeacherDeleted(@Payload() payload: { id: number }) {
    console.log(`⚡ Worker received: Delete teacher ${payload.id} from index`);
    try {
      await this.searchIndexer['typesense'].collections('teachers').documents(payload.id.toString()).delete();
      console.log('✅ Typesense Teacher Index Updated (deleted)');
    } catch (e) {
      console.error('❌ Error deleting teacher from index', e);
    }
  }
}
