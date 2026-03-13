import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../../entities/staff.entity';
import { TeacherAttendance } from '../../entities/teacher-attendance.entity';
import { Payslip } from '../../entities/payslip.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    @InjectRepository(TeacherAttendance) private attendanceRepo: Repository<TeacherAttendance>,
    @InjectRepository(Payslip) private payslipRepo: Repository<Payslip>,
  ) {}

  async generateMonthlyPayslips(month: number, year: number) {
    const teachers = await this.staffRepo.find();
    const generated = [];

    for (const teacher of teachers) {
      const attendances = await this.attendanceRepo.createQueryBuilder('att')
        .where('att.staff_id = :staffId', { staffId: teacher.id })
        .andWhere('EXTRACT(MONTH FROM att.date) = :month', { month })
        .andWhere('EXTRACT(YEAR FROM att.date) = :year', { year })
        .getMany();

      let totalHours = 0;
      let totalDelayMinutes = 0;

      attendances.forEach(att => {
        if (att.status === 'PRESENT' || att.status === 'LATE') {
          if (att.arrivalTime && att.departureTime) {
            const start = new Date(`1970-01-01T${att.arrivalTime}Z`);
            const end = new Date(`1970-01-01T${att.departureTime}Z`);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            totalHours += hours;
          }
          totalDelayMinutes += att.delayMinutes;
        }
      });

      const grossSalary = totalHours * Number(teacher.hourlyRate || 0);
      // Exemple de pénalité : 50% du taux horaire par heure de retard
      const deductions = (totalDelayMinutes / 60) * (Number(teacher.hourlyRate || 0) * 0.5); 
      const netSalary = grossSalary - deductions;

      const payslip = this.payslipRepo.create({
        staff: teacher,
        month,
        year,
        totalHours,
        grossSalary,
        deductions,
        netSalary,
        status: 'GENERATED'
      });

      generated.push(await this.payslipRepo.save(payslip));
    }
    return generated;
  }
}
