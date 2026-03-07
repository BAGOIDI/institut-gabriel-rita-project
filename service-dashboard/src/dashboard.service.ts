import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  // Structure exacte attendue par Dashboard.tsx
  async getStats(period: string) {
    try {
      const [studentsRes, staffRes, paymentsRes, attendanceRes] = await Promise.allSettled([
        this.dataSource.query('SELECT COUNT(*) as count FROM public.students WHERE "isActive" = true'),
        this.dataSource.query('SELECT COUNT(*) as count FROM public.staff WHERE "isActive" = true'),
        this.dataSource.query(`
          SELECT 
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count
          FROM finance_payments 
          WHERE DATE_TRUNC('month', "paymentDate") = DATE_TRUNC('month', CURRENT_DATE)
        `),
        this.dataSource.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
            COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
            COUNT(*) FILTER (WHERE status = 'LATE') as late,
            COUNT(*) as total
          FROM attendance 
          WHERE date = CURRENT_DATE
        `),
      ]);

      const totalStudents = studentsRes.status === 'fulfilled' ? parseInt(studentsRes.value[0]?.count || '0') : 0;
      const totalStaff = staffRes.status === 'fulfilled' ? parseInt(staffRes.value[0]?.count || '0') : 0;
      const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value[0] : { total: 0, count: 0 };
      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value[0] : { present: 0, absent: 0, late: 0, total: 0 };

      const present = parseInt(attendance.present || '0');
      const late = parseInt(attendance.late || '0');
      const absent = parseInt(attendance.absent || '0');
      const totalAttendance = parseInt(attendance.total || '0');

      return {
        stats: {
          teachersPresent: {
            value: present + late,
            change: '+0%',
            isPositive: true,
          },
          studentsEnrolled: {
            value: totalStudents,
            change: '+0%',
            isPositive: true,
          },
          totalPayments: {
            value: `${Number(payments.total || 0).toLocaleString('fr-FR')} FCFA`,
            change: '+0%',
            isPositive: true,
          },
          absentToday: {
            value: absent,
            change: '0%',
            isPositive: false,
          },
          totalStaff: {
            value: totalStaff,
            change: '+0%',
            isPositive: true,
          },
          attendanceRate: {
            value: totalAttendance > 0 ? `${Math.round(((present + late) / totalAttendance) * 100)}%` : '0%',
            change: '0%',
            isPositive: true,
          },
        },
        charts: {
          payments: await this.getPaymentsChart(),
          attendance: await this.getAttendanceChart(),
        },
        recentActivity: [],
      };
    } catch (e) {
      this.fallbackStats();
    }
  }

  private fallbackStats() {
    return {
      stats: {
        teachersPresent: { value: 0, change: '0%', isPositive: true },
        studentsEnrolled: { value: 0, change: '0%', isPositive: true },
        totalPayments: { value: '0 FCFA', change: '0%', isPositive: true },
        absentToday: { value: 0, change: '0%', isPositive: false },
        totalStaff: { value: 0, change: '0%', isPositive: true },
        attendanceRate: { value: '0%', change: '0%', isPositive: true },
      },
      charts: { payments: [], attendance: [] },
      recentActivity: [],
    };
  }

  private async getPaymentsChart() {
    try {
      const rows = await this.dataSource.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "paymentDate"), 'Mon') as month,
          COALESCE(SUM(CASE WHEN type = 'ENCAISSEMENT' THEN amount ELSE 0 END), 0) as encaissements,
          COALESCE(SUM(CASE WHEN type = 'DECAISSEMENT' THEN amount ELSE 0 END), 0) as decaissements
        FROM finance_payments
        WHERE "paymentDate" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "paymentDate")
        ORDER BY DATE_TRUNC('month', "paymentDate") ASC
      `);
      return rows;
    } catch { return []; }
  }

  private async getAttendanceChart() {
    try {
      const rows = await this.dataSource.query(`
        SELECT 
          TO_CHAR(date, 'Dy') as day,
          COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
          COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
          COUNT(*) FILTER (WHERE status = 'LATE') as late
        FROM attendance
        WHERE date >= NOW() - INTERVAL '7 days'
        GROUP BY date
        ORDER BY date ASC
      `);
      return rows;
    } catch { return []; }
  }

  // Route legacy
  async getSummary() {
    try {
      const totalStudents = await this.dataSource.query('SELECT COUNT(*) FROM public.students');
      const totalStaff = await this.dataSource.query('SELECT COUNT(*) FROM public.staff');
      return {
        totalStudents: parseInt(totalStudents[0].count),
        totalStaff: parseInt(totalStaff[0].count),
        status: 'operational',
      };
    } catch (e) {
      return { totalStudents: 0, totalStaff: 0, status: 'db_error', error: e.message };
    }
  }
}
