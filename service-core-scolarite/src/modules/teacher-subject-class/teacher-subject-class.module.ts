import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherSubjectClass } from '../../entities/teacher-subject-class.entity';
import { TeacherSubjectClassService } from './teacher-subject-class.service';
import { TeacherSubjectClassController } from './teacher-subject-class.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherSubjectClass])],
  providers: [TeacherSubjectClassService],
  controllers: [TeacherSubjectClassController],
  exports: [TeacherSubjectClassService],
})
export class TeacherSubjectClassModule {}
