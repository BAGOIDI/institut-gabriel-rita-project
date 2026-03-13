import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { StudentFee } from './entities/student-fee.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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

  // ========== REFERENCE GENERATION ==========

  private async generatePaymentReference(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}`;
    
    const count = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('EXTRACT(YEAR FROM payment.payment_date) = :year', { year })
      .getCount();
    
    const sequence = String(count + 1).padStart(6, '0');
    return `${prefix}-${sequence}`;
  }

  // ========== BALANCE VALIDATION ==========

  private async validatePaymentAmount(feeId: number, amount: number, excludePaymentId?: number): Promise<void> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId },
      relations: ['payments'],
    });
    
    if (!fee) {
      throw new NotFoundException(`Student Fee with ID ${feeId} not found`);
    }

    const totalDue = Number(fee.total_due);
    const paidSoFar = fee.payments
      ?.filter(p => !p.deleted_at && p.id !== excludePaymentId)
      ?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
    
    const remaining = totalDue - paidSoFar;

    if (amount > remaining) {
      throw new BadRequestException(
        `Payment amount (${amount}) exceeds remaining balance (${remaining}). Total due: ${totalDue}, Already paid: ${paidSoFar}`
      );
    }
  }

  // ========== PAYMENTS CRUD ==========

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const feeRepo = manager.getRepository(StudentFee);
      const paymentRepo = manager.getRepository(Payment);

      const fee = await feeRepo.findOne({ where: { id: dto.studentFeeId } });
      if (!fee) {
        this.logger.warn(`Attempted payment for non-existent fee ID: ${dto.studentFeeId}`);
        throw new NotFoundException(`Student Fee record with ID ${dto.studentFeeId} not found`);
      }

      await this.validatePaymentAmount(dto.studentFeeId, dto.amount);

      const reference = await this.generatePaymentReference();

      const payment = paymentRepo.create({
        reference,
        amount_paid: dto.amount,
        payment_method: dto.method,
        recorded_by: dto.userId,
        student_fee_id: dto.studentFeeId,
        notes: dto.notes,
        status: PaymentStatus.COMPLETED,
      });

      const savedPayment = await paymentRepo.save(payment);
      this.logger.log(`Payment ${reference} of ${dto.amount} recorded for Fee ID ${dto.studentFeeId}`);
      return savedPayment;
    });
  }

  async findAllPayments(options: PaginationOptions = {}): Promise<PaginatedResult<Payment>> {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      relations: ['studentFee'],
      order: { payment_date: 'DESC' },
      skip,
      take: limit,
      withDeleted: false,
    });

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPaymentById(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['studentFee'],
      withDeleted: false,
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async updatePayment(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const feeRepo = manager.getRepository(StudentFee);

      const payment = await paymentRepo.findOne({
        where: { id },
        relations: ['studentFee'],
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      if (dto.amount && dto.amount !== payment.amount_paid) {
        await this.validatePaymentAmount(
          dto.studentFeeId || payment.student_fee_id,
          dto.amount,
          payment.id
        );
      }

      if (dto.studentFeeId && dto.studentFeeId !== payment.student_fee_id) {
        const fee = await feeRepo.findOne({ where: { id: dto.studentFeeId } });
        if (!fee) {
          throw new NotFoundException(`Student Fee record with ID ${dto.studentFeeId} not found`);
        }
        payment.student_fee_id = dto.studentFeeId;
      }

      if (dto.amount) payment.amount_paid = dto.amount;
      if (dto.method) payment.payment_method = dto.method;
      if (dto.userId) payment.recorded_by = dto.userId;
      if (dto.status) payment.status = dto.status;
      if (dto.notes !== undefined) payment.notes = dto.notes;

      const updated = await paymentRepo.save(payment);
      this.logger.log(`Payment ${id} updated`);
      return updated;
    });
  }

  async deletePayment(id: number): Promise<void> {
    const payment = await this.findPaymentById(id);
    await this.paymentRepository.softRemove(payment);
    this.logger.log(`Payment ${id} soft deleted`);
  }

  async restorePayment(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    await this.paymentRepository.recover(payment);
    this.logger.log(`Payment ${id} restored`);
    return payment;
  }

  async searchPayments(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Payment>> {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const qb = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.studentFee', 'fee')
      .where('payment.deleted_at IS NULL')
      .andWhere(
        '(CAST(payment.id AS TEXT) LIKE :query OR ' +
        'CAST(payment.student_fee_id AS TEXT) LIKE :query OR ' +
        'payment.reference LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('payment.payment_date', 'DESC')
      .skip(skip)
      .take(limit);

    const [payments, total] = await qb.getManyAndCount();

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
      const paid = fee.payments
        ?.filter(p => !p.deleted_at)
        ?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
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
       LEFT JOIN finance_payments p ON sf.id = p.student_fee_id AND p.deleted_at IS NULL
    `);

    const expected = Number(result[0].total_expected || 0);
    const collected = Number(result[0].total_collected || 0);

    return {
      total_expected: expected,
      total_collected: collected,
      total_outstanding: expected - collected,
    };
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date, options: PaginationOptions = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const qb = this.paymentRepository.createQueryBuilder('payment')
      .where('payment.payment_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('payment.deleted_at IS NULL')
      .leftJoinAndSelect('payment.studentFee', 'fee')
      .orderBy('payment.payment_date', 'DESC')
      .skip(skip)
      .take(limit);

    const [payments, total] = await qb.getManyAndCount();

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}