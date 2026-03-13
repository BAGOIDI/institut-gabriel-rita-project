import { Injectable } from '@nestjs/common';
import { PayrollRepository } from '../repositories/payroll.repository';
import { SalaryUtility } from '../utilities/salary.utility';
import { GeneratePayrollPayload } from '../payloads/generate-payroll.payload';
import { PayrollAlreadyExistsException } from '../exceptions/payroll.exceptions';

@Injectable()
export class PayrollService {
  constructor(private readonly payrollRepo: PayrollRepository) {}

  async generateSlip(payload: GeneratePayrollPayload) {
    const existing = await this.payrollRepo.findByStaffAndMonth(payload.staffId, payload.month);
    if (existing) throw new PayrollAlreadyExistsException(payload.month);

    // Simulation: Récupération des données depuis le service Attendance/Planning
    const hoursWorked = 120; 
    const hourlyRate = 5000; // FCFA par exemple
    const totalDelayMinutes = 45;

    const penalties = SalaryUtility.calculateDelayPenalty(totalDelayMinutes, hourlyRate);
    const netSalary = SalaryUtility.calculateNetSalary(hoursWorked, hourlyRate, penalties);

    const slip = this.payrollRepo.create({
      staff_id: payload.staffId,
      month: payload.month,
      base_salary: hoursWorked * hourlyRate,
      hourly_rate: hourlyRate,
      hours_worked: hoursWorked,
      delay_penalties: penalties,
      net_salary: netSalary
    });

    return await this.payrollRepo.save(slip);
  }
}