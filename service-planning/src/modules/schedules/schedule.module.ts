import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleService } from './services/schedule.service';
import { ScheduleRepository } from './repositories/schedule.repository';
import { CourseSchedule } from './entities/schedule.entity';

import { ScheduleUtility } from './utilities/schedule.utility';
import { ScheduleProvider } from './providers/schedule.provider';
import { ScheduleGuard } from './security/schedule.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CourseSchedule])],
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    ScheduleRepository,
    ScheduleUtility,
    ScheduleProvider,
    ScheduleGuard
  ],
  exports: [ScheduleService, ScheduleProvider]
})
export class SchedulesModule {}