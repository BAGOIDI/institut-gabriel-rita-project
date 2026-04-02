import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeEntity } from './entities/grade.entity';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GradeEntity])],
  providers: [GradesService],
  controllers: [GradesController],
  exports: [GradesService],
})
export class GradesModule {}

