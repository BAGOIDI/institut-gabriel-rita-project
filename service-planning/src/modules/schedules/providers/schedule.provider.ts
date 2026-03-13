import { Injectable } from '@nestjs/common';
import { ScheduleRepository } from '../repositories/schedule.repository';

@Injectable()
export class ScheduleProvider {
  constructor(private readonly repo: ScheduleRepository) {}

  /**
   * Provides data for exporting the schedule
   */
  async getExportData(classId?: number, staffId?: number) {
    if (classId) {
      return await this.repo.find({ where: { classId } });
    }
    if (staffId) {
      return await this.repo.find({ where: { staffId } });
    }
    return await this.repo.find();
  }

  /**
   * Provides statistics about the schedule
   */
  async getStats() {
    const total = await this.repo.count();
    // More stats can be added here
    return {
      totalSchedules: total,
    };
  }
}
