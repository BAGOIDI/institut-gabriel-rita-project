import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { StudentFee } from './entities/student-fee.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(StudentFee)
    private feeRepository: Repository<StudentFee>,
    private dataSource: DataSource,
  ) {}

  async recordPayment(dto: CreatePaymentDto) {
    // 1. Verify fee exists
    const fee = await this.feeRepository.findOne({ where: { id: dto.studentFeeId } });
    if (!fee) {
      this.logger.warn(`Attempted payment for non-existent fee ID: ${dto.studentFeeId}`);
      throw new NotFoundException(`Student Fee record with ID ${dto.studentFeeId} not found`);
    }

    // 2. Create Payment Entity
    const payment = this.paymentRepository.create({
      amount_paid: dto.amount,
      payment_method: dto.method,
      recorded_by: dto.userId,
      student_fee_id: dto.studentFeeId,
    });

    // 3. Save
    await this.paymentRepository.save(payment);
    this.logger.log(`Payment of ${dto.amount} recorded for Fee ID ${dto.studentFeeId}`);

    return { status: 'success', paymentId: payment.id };
  }

  async getStudentBalance(studentId: number) {
    // Using QueryBuilder for complex aggregation
    const result = await this.feeRepository.createQueryBuilder('fee')
      .leftJoinAndSelect('fee.payments', 'payment')
      .where('fee.student_id = :studentId', { studentId })
      .getMany();

    if (!result.length) {
        return { message: 'No fees found for this student', balance: 0 };
    }

    // Calculate balance in JS (or could do in SQL)
    return result.map(fee => {
      const paid = fee.payments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
      return {
        feeId: fee.id,
        totalDue: Number(fee.total_due),
        paid: paid,
        balance: Number(fee.total_due) - paid
      };
    });
  }

  async getGlobalReport() {
    // Raw query is still sometimes best for global aggregates
    const result = await this.dataSource.query(`
       SELECT 
       SUM(sf.total_due) as total_expected,
       SUM(p.amount_paid) as total_collected
       FROM finance_student_fees sf
       LEFT JOIN finance_payments p ON sf.id = p.student_fee_id
    `);
    
    const expected = Number(result[0].total_expected || 0);
    const collected = Number(result[0].total_collected || 0);
    
    return {
      total_expected: expected,
      total_collected: collected,
      total_outstanding: expected - collected
    };
  }
}