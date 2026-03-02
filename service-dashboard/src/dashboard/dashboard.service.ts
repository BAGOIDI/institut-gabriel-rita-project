import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  async getSummary() {
    // Safe queries that won't crash if tables are missing
    try {
        const totalStudents = await this.dataSource.query('SELECT COUNT(*) FROM public.students');
        const totalStaff = await this.dataSource.query('SELECT COUNT(*) FROM public.staff');
        return {
          totalStudents: parseInt(totalStudents[0].count),
          totalStaff: parseInt(totalStaff[0].count),
          status: 'operational'
        };
    } catch (e) {
        console.error('Database Error:', e.message);
        return { 
            totalStudents: 0, 
            totalStaff: 0, 
            status: 'db_error',
            error: e.message 
        };
    }
  }
}