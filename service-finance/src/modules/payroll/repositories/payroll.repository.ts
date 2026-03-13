import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PayrollSlip } from '../entities/payroll-slip.entity';

@Injectable()
export class PayrollRepository extends Repository<PayrollSlip> {
  constructor(private dataSource: DataSource) {
    super(PayrollSlip, dataSource.createEntityManager());
  }
  async findByStaffAndMonth(staffId: number, month: string) {
    return this.findOne({ where: { staff_id: staffId, month } });
  }
}