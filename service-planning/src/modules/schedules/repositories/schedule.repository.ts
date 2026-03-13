import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CourseSchedule } from '../entities/schedule.entity';

@Injectable()
export class ScheduleRepository extends Repository<CourseSchedule> {
  constructor(private dataSource: DataSource) {
    super(CourseSchedule, dataSource.createEntityManager());
  }
  async findByStaffAndDay(staffId: number, dayOfWeek: number) {
    return this.find({ where: { staffId: staffId, dayOfWeek: dayOfWeek } });
  }

  async findByClassAndDay(classId: number, dayOfWeek: number) {
    return this.find({ where: { classId, dayOfWeek } });
  }

  async findByRoomAndDay(roomName: string, dayOfWeek: number) {
    return this.find({ where: { roomName, dayOfWeek } });
  }
}