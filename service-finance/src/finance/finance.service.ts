import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { StudentFee } from './entities/student-fee.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

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

  // ========== PAYMENTS CRUD ==========

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const fee = await this.feeRepository.findOne({ where: { id: dto.studentFeeId } });
    if (!fee) {
      this.logger.warn(`Attempted payment for non-existent fee ID: ${dto.studentFeeId}`);
      throw new NotFoundException(`Student Fee record with ID ${dto.studentFeeId} not found`);
    }

    const payment = this.paymentRepository.create({
      amount_paid: dto.amount,
      payment_method: dto.method,
      recorded_by: dto.userId,
      student_fee_id: dto.studentFeeId,
    });

    const savedPayment = await this.paymentRepository.save(payment);
    this.logger.log(`Payment of ${dto.amount} recorded for Fee ID ${dto.studentFeeId}`);
    return savedPayment;
  }

  async findAllPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['studentFee'],
      order: { payment_date: 'DESC' },
    });
  }

  async findPaymentById(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['studentFee'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async updatePayment(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findPaymentById(id);

    if (dto.studentFeeId && dto.studentFeeId !== payment.student_fee_id) {
      const fee = await this.feeRepository.findOne({ where: { id: dto.studentFeeId } });
      if (!fee) {
        throw new NotFoundException(`Student Fee record with ID ${dto.studentFeeId} not found`);
      }
      payment.student_fee_id = dto.studentFeeId;
    }

    if (dto.amount) payment.amount_paid = dto.amount;
    if (dto.method) payment.payment_method = dto.method;
    if (dto.userId) payment.recorded_by = dto.userId;

    const updated = await this.paymentRepository.save(payment);
    this.logger.log(`Payment ${id} updated`);
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    const payment = await this.findPaymentById(id);
    await this.paymentRepository.remove(payment);
    this.logger.log(`Payment ${id} deleted`);
  }

  // ========== STUDENT FEES CRUD ==========

  async createStudentFee(studentId: number, totalDue: number): Promise<StudentFee> {
    const fee = this.feeRepository.create({
      student_id: studentId,
      total_due: totalDue,
    });
    const saved = await this.feeRepository.save(fee);
    this.logger.log(`StudentFee created for student ${studentId}`);
    return saved;
  }

  async findAllStudentFees(): Promise<StudentFee[]> {
    return this.feeRepository.find({
      relations: ['payments'],
    });
  }

  async findStudentFeeById(id: number): Promise<StudentFee> {
    const fee = await this.feeRepository.findOne({
      where: { id },
      relations: ['payments'],
    });
    if (!fee) {
      throw new NotFoundException(`Student Fee with ID ${id} not found`);
    }
    return fee;
  }

  async updateStudentFee(id: number, totalDue: number): Promise<StudentFee> {
    const fee = await this.findStudentFeeById(id);
    fee.total_due = totalDue;
    const updated = await this.feeRepository.save(fee);
    this.logger.log(`StudentFee ${id} updated`);
    return updated;
  }

  async deleteStudentFee(id: number): Promise<void> {
    const fee = await this.findStudentFeeById(id);
    await this.feeRepository.remove(fee);
    this.logger.log(`StudentFee ${id} deleted`);
  }

  // ========== BALANCE & REPORTS ==========

  async getStudentBalance(studentId: number) {
    const result = await this.feeRepository.find({
      where: { student_id: studentId },
      relations: ['payments'],
    });

    if (!result.length) {
      return { message: 'No fees found for this student', balance: 0, fees: [] };
    }

    const fees = result.map(fee => {
      const paid = fee.payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      return {
        feeId: fee.id,
        totalDue: Number(fee.total_due),
        paid: paid,
        balance: Number(fee.total_due) - paid,
      };
    });

    const totalBalance = fees.reduce((sum, f) => sum + f.balance, 0);

    return {
      studentId,
      totalBalance,
      fees,
    };
  }

  async getGlobalReport() {
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
      total_outstanding: expected - collected,
    };
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date) {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.payment_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .leftJoinAndSelect('payment.studentFee', 'fee')
      .getMany();
  }
}