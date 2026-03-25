import { Injectable, NotFoundException, Logger, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan, Not } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Payment } from './entities/payment.entity';
import { StudentFee } from './entities/student-fee.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Disbursement } from './entities/disbursement.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';

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
    @InjectRepository(PaymentPlan)
    private paymentPlanRepository: Repository<PaymentPlan>,
    @InjectRepository(Disbursement)
    private disbursementRepository: Repository<Disbursement>,
    private dataSource: DataSource,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) {}

  // ========== REFERENCE GENERATION ==========

  private async generatePaymentReference(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}`;
    
    // Use count on non-deleted payments
    const count = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('EXTRACT(YEAR FROM payment.paymentDate) = :year', { year })
      .andWhere('payment.deletedAt IS NULL')
      .getCount();
    
    const sequence = String(count + 1).padStart(6, '0');
    return `${prefix}-${sequence}`;
  }

  // ========== BALANCE VALIDATION & FEE STATUS UPDATE ==========

  private async updateFeeStatus(feeId: number, manager = this.dataSource.manager): Promise<void> {
    const feeRepo = manager.getRepository(StudentFee);
    const fee = await feeRepo.findOne({
      where: { id: feeId },
      relations: ['payments'],
    });

    if (fee) {
      const totalDue = Number(fee.total_due);
      const paidSoFar = fee.payments
        ?.filter(p => !p.deletedAt && (p.status === 'ACTIVE' || !p.status))
        ?.reduce((sum, p) => sum + Number(p.amountPaid), 0) || 0;
      
      const isFullyPaid = paidSoFar >= totalDue;
      if (fee.is_fully_paid !== isFullyPaid) {
        fee.is_fully_paid = isFullyPaid;
        await feeRepo.save(fee);
        this.logger.log(`StudentFee ${feeId} status updated: is_fully_paid = ${isFullyPaid}`);
        
        // Notify about student status change if needed
        this.client.emit('student_fee_status_updated', { studentId: fee.student_id, isFullyPaid });
      }
    }
  }

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
      ?.filter(p => !p.deletedAt && (p.status === 'ACTIVE' || !p.status) && p.id !== excludePaymentId)
      ?.reduce((sum, p) => sum + Number(p.amountPaid), 0) || 0;
    
    const remaining = totalDue - paidSoFar;

    if (amount > remaining + 0.01) { // Adding small epsilon for float precision
      throw new BadRequestException(
        `Le montant (${amount}) dépasse le solde restant (${remaining}). Total dû: ${totalDue}, Déjà payé: ${paidSoFar}`
      );
    }
  }

  // ========== PAYMENTS CRUD ==========

  async createPayment(dto: CreatePaymentDto): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const feeRepo = manager.getRepository(StudentFee);
      const paymentRepo = manager.getRepository(Payment);

      const fee = await feeRepo.findOne({ where: { id: dto.studentFeeId } });
      if (!fee) {
        this.logger.warn(`Attempted payment for non-existent fee ID: ${dto.studentFeeId}`);
        throw new NotFoundException(`Student Fee record with ID ${dto.studentFeeId} not found`);
      }

      await this.validatePaymentAmount(dto.studentFeeId, dto.amount);

      // Check for duplicate payment (same student, same amount, within last 30s)
      const recentDuplicate = await paymentRepo.findOne({
        where: {
          studentFeeId: dto.studentFeeId,
          amountPaid: dto.amount,
          paymentDate: MoreThan(new Date(Date.now() - 30000))
        }
      });

      if (recentDuplicate) {
        throw new BadRequestException('Un paiement identique a été enregistré il y a moins de 30 secondes.');
      }

      const reference = await this.generatePaymentReference();
      const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

      const payment = paymentRepo.create({
        reference: dto.reference || reference,
        amountPaid: dto.amount,
        paymentMethod: dto.method,
        recordedBy: dto.userId,
        studentFeeId: dto.studentFeeId,
        studentName: dto.studentName,
        studentMatricule: dto.studentMatricule,
        type: 'ENCAISSEMENT',
        penalty: dto.penalty || 0,
        discount: dto.discount || 0,
        description: dto.notes,
        paymentDate: paymentDate,
      });

      const savedPayment = await paymentRepo.save(payment);
      
      // Update fee status (fully paid?)
      await this.updateFeeStatus(dto.studentFeeId, manager);

      this.logger.log(`Payment ${reference} recorded for Fee ID ${dto.studentFeeId}`);
      
      // Emit event for real-time dashboard
      this.client.emit('payment_created', {
        ...savedPayment,
        studentId: fee.student_id
      });

      return savedPayment;
    });
  }

  async findAllPayments(options: { page?: number; limit?: number; date?: string; q?: string; method?: string } = {}): Promise<PaginatedResult<Payment>> {
    const { page = 1, limit = 50, date, q, method } = options;
    const skip = (page - 1) * limit;

    const qb = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.studentFee', 'fee')
      .where('payment.deleted_at IS NULL');

    if (date) {
      const paymentDate = new Date(date);
      qb.andWhere('payment.paymentDate >= :start AND payment.paymentDate < :end', {
        start: paymentDate,
        end: new Date(paymentDate.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    if (method && method !== 'ALL') {
      qb.andWhere('payment.paymentMethod = :method', { method });
    }

    if (q) {
      qb.andWhere(
        '(CAST(payment.id AS TEXT) LIKE :query OR ' +
        'CAST(payment.studentFeeId AS TEXT) LIKE :query OR ' +
        'payment.reference LIKE :query OR ' +
        'payment.studentName ILIKE :query OR ' +
        'payment.studentMatricule ILIKE :query)',
        { query: `%${q}%` }
      );
    }

    qb.orderBy('payment.paymentDate', 'DESC')
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

  async updatePayment(id: number, dto: UpdatePaymentDto): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);

      const payment = await paymentRepo.findOne({
        where: { id },
        relations: ['studentFee'],
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      const originalFeeId = payment.studentFeeId;

      if (dto.amount && dto.amount !== Number(payment.amountPaid)) {
        await this.validatePaymentAmount(
          dto.studentFeeId || payment.studentFeeId,
          dto.amount,
          payment.id
        );
        payment.amountPaid = dto.amount;
      }

      if (dto.studentFeeId && dto.studentFeeId !== payment.studentFeeId) {
        const feeRepo = manager.getRepository(StudentFee);
        const fee = await feeRepo.findOne({ where: { id: dto.studentFeeId } });
        if (!fee) {
          throw new NotFoundException(`Student Fee record with ID ${dto.studentFeeId} not found`);
        }
        payment.studentFeeId = dto.studentFeeId;
      }

      if (dto.method) payment.paymentMethod = dto.method;
      if (dto.userId) payment.recordedBy = dto.userId;
      if (dto.notes !== undefined) payment.description = dto.notes;
      if (dto.penalty !== undefined) payment.penalty = dto.penalty;
      if (dto.discount !== undefined) payment.discount = dto.discount;
      if (dto.paymentDate) payment.paymentDate = new Date(dto.paymentDate);
      if (dto.reference !== undefined) payment.reference = dto.reference;

      const updated = await paymentRepo.save(payment);
      
      // Update status for both potential fees
      await this.updateFeeStatus(originalFeeId, manager);
      if (payment.studentFeeId !== originalFeeId) {
        await this.updateFeeStatus(payment.studentFeeId, manager);
      }

      this.logger.log(`Payment ${id} updated`);
      this.client.emit('payment_updated', updated);
      
      return updated;
    });
  }

  async cancelPayment(id: number): Promise<Payment> {
    const payment = await this.findPaymentById(id);
    if (payment.status === 'CANCELLED') {
      throw new BadRequestException('Ce paiement est déjà annulé.');
    }
    
    payment.status = 'CANCELLED';
    const saved = await this.paymentRepository.save(payment);
    
    if (payment.studentFeeId) {
      await this.updateFeeStatus(payment.studentFeeId);
    }
    
    this.logger.log(`Payment ${id} cancelled`);
    this.client.emit('payment_cancelled', id);
    return saved;
  }

  async deletePayment(id: number): Promise<void> {
    const payment = await this.findPaymentById(id);
    const feeId = payment.studentFeeId;
    
    await this.paymentRepository.softDelete(id);
    
    // Update fee status after deletion
    if (feeId) {
      await this.updateFeeStatus(feeId);
    }
    
    this.logger.log(`Payment ${id} soft deleted`);
    this.client.emit('payment_deleted', id);
  }

  async restorePayment(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!payment) {
      throw new NotFoundException(`Paiement avec l'ID ${id} non trouvé`);
    }

    payment.status = 'ACTIVE';
    const saved = await this.paymentRepository.save(payment);
    
    if (payment.studentFeeId) {
      await this.updateFeeStatus(payment.studentFeeId);
    }
    
    this.logger.log(`Payment ${id} restored from cancellation`);
    this.client.emit('payment_restored', payment);
    return saved;
  }

  async restoreDisbursement(id: number): Promise<Disbursement> {
    const disbursement = await this.disbursementRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!disbursement) {
      throw new NotFoundException(`Décaissement avec l'ID ${id} non trouvé`);
    }

    disbursement.status = 'ACTIVE';
    const saved = await this.disbursementRepository.save(disbursement);
    
    this.logger.log(`Disbursement ${id} restored from cancellation`);
    this.client.emit('disbursement_restored', saved);
    return saved;
  }

  async searchPayments(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Payment>> {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const qb = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.studentFee', 'fee')
      .where('payment.deletedAt IS NULL')
      .andWhere(
        '(CAST(payment.id AS TEXT) LIKE :query OR ' +
        'CAST(payment.studentFeeId AS TEXT) LIKE :query OR ' +
        'payment.reference LIKE :query OR ' +
        'payment.studentName ILIKE :query OR ' +
        'payment.studentMatricule ILIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('payment.paymentDate', 'DESC')
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
    this.client.emit('student_fee_created', saved);
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
    
    // Re-validate status
    await this.updateFeeStatus(id);
    
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
        ?.filter(p => !p.deletedAt)
        ?.reduce((sum, p) => sum + Number(p.amountPaid), 0) || 0;
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
       LEFT JOIN finance_payments p ON sf.id = p.student_fee_id AND p.deleted_at IS NULL AND (p.status IS NULL OR p.status != 'CANCELLED')
    `);

    const expected = Number(result[0].total_expected || 0);
    const collected = Number(result[0].total_collected || 0);

    return {
      total_expected: expected,
      total_collected: collected,
      total_outstanding: expected - collected,
    };
  }

  async getPaymentsByDateRange(startDate: Date | undefined, endDate: Date | undefined, options: PaginationOptions = {}, method?: string, q?: string) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const qb = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.studentFee', 'fee')
      .andWhere('payment.deleted_at IS NULL')
      .andWhere('(payment.status IS NULL OR payment.status != :cancelled)', { cancelled: 'CANCELLED' });

    if (startDate) {
      qb.andWhere('payment.paymentDate >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('payment.paymentDate <= :endDate', { endDate });
    }

    if (method && method !== 'ALL') {
      qb.andWhere('payment.paymentMethod = :method', { method });
    }

    if (q) {
      qb.andWhere(
        '(CAST(payment.id AS TEXT) LIKE :query OR ' +
        'CAST(payment.studentFeeId AS TEXT) LIKE :query OR ' +
        'payment.reference LIKE :query OR ' +
        'payment.studentName ILIKE :query OR ' +
        'payment.studentMatricule ILIKE :query)',
        { query: `%${q}%` }
      );
    }

    qb.orderBy('payment.paymentDate', 'DESC')
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

  async getPaymentsCsv(startDate?: Date, endDate?: Date, method?: string, q?: string): Promise<string> {
    const qb = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.studentFee', 'fee')
      .andWhere('payment.deleted_at IS NULL')
      .andWhere('(payment.status IS NULL OR payment.status != :cancelled)', { cancelled: 'CANCELLED' });

    if (startDate && endDate) {
      qb.andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (method && method !== 'ALL') {
      qb.andWhere('payment.paymentMethod = :method', { method });
    }

    if (q) {
      qb.andWhere(
        '(CAST(payment.id AS TEXT) LIKE :query OR ' +
        'CAST(payment.studentFeeId AS TEXT) LIKE :query OR ' +
        'payment.reference LIKE :query OR ' +
        'payment.studentName LIKE :query OR ' +
        'payment.studentMatricule LIKE :query)',
        { query: `%${q}%` }
      );
    }

    const payments = await qb.orderBy('payment.paymentDate', 'DESC').getMany();

    const header = 'ID,Date,Référence,Étudiant,Matricule,Montant,Méthode,Pénalité,Réduction,Notes\n';
    const rows = payments.map(p => {
      const date = new Date(p.paymentDate).toLocaleDateString('fr-FR');
      const student = p.studentName || 'N/A';
      const matricule = p.studentMatricule || 'N/A';
      const notes = (p.description || '').replace(/,/g, ' ');
      return `${p.id},${date},${p.reference},"${student}",${matricule},${p.amountPaid},${p.paymentMethod},${p.penalty},${p.discount},"${notes}"`;
    }).join('\n');

    return header + rows;
  }

  // ========== STATISTICS ==========

  async getStats(opts: { year?: number; month?: number }) {
    const { year, month } = opts;
    
    // Fetch Payments (Encaissements)
    const paymentQb = this.paymentRepository.createQueryBuilder('payment');
    if (year !== undefined && year !== null) {
      paymentQb.where('EXTRACT(YEAR FROM payment.paymentDate) = :year', { year });
    }
    if (month !== undefined && month !== null) {
      const condition = paymentQb.getQuery().includes('WHERE') ? 'andWhere' : 'where';
      paymentQb[condition]('EXTRACT(MONTH FROM payment.paymentDate) = :month', { month: month + 1 });
    }
    paymentQb.andWhere('payment.deleted_at IS NULL');
    paymentQb.andWhere('(payment.status IS NULL OR payment.status != :cancelled)', { cancelled: 'CANCELLED' });
    const payments = await paymentQb.getMany();

    // Fetch Disbursements (Décaissements)
    const disbursementQb = this.disbursementRepository.createQueryBuilder('disbursement');
    if (year !== undefined && year !== null) {
      disbursementQb.where('EXTRACT(YEAR FROM disbursement.paymentDate) = :year', { year });
    }
    if (month !== undefined && month !== null) {
      const condition = disbursementQb.getQuery().includes('WHERE') ? 'andWhere' : 'where';
      disbursementQb[condition]('EXTRACT(MONTH FROM disbursement.paymentDate) = :month', { month: month + 1 });
    }
    disbursementQb.andWhere('disbursement.deleted_at IS NULL');
    disbursementQb.andWhere('(disbursement.status IS NULL OR disbursement.status != :cancelled)', { cancelled: 'CANCELLED' });
    const disbursements = await disbursementQb.getMany();

    const sum = (arr: any[], field1: string, field2?: string) =>
      arr.reduce((acc, p) => acc + Number(p[field1] || (field2 ? p[field2] : 0) || 0), 0);

    const totalEncaissements = sum(payments, 'amountPaid');
    const totalDecaissements = sum(disbursements, 'amount');

    // Add student-related stats
    const totalFees = await this.feeRepository.find();
    const totalExpected = sum(totalFees, 'total_due');
    const totalCollected = totalEncaissements;
    const fullyPaidCount = totalFees.filter(f => f.is_fully_paid).length;
    const partiallyPaidCount = totalFees.filter(f => !f.is_fully_paid && f.total_due > 0).length;

    // Generate monthly data for chart (last 6 months) - focused on Encaissements
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('fr-FR', { month: 'short' });
      const monthYear = d.getFullYear();
      const monthMonth = d.getMonth() + 1;

      const monthPayments = payments.filter(p => {
        const pDate = new Date(p.paymentDate);
        return pDate.getFullYear() === monthYear && (pDate.getMonth() + 1) === monthMonth;
      });

      monthlyData.push({
        month: monthName,
        amount: sum(monthPayments, 'amountPaid'),
      });
    }

    return {
      totalPayments: payments.length,
      totalEncaissements,
      totalDecaissements,
      netAmount: totalEncaissements - totalDecaissements,
      totalPenalties: sum(payments, 'penalty'),
      totalDiscounts: sum(payments, 'discount'),
      cashPayments: sum(payments.filter(p => p.paymentMethod === 'CASH'), 'amountPaid') + sum(disbursements.filter(d => d.paymentMethod === 'CASH'), 'amount'),
      bankTransfers: sum(payments.filter(p => p.paymentMethod === 'BANK_TRANSFER'), 'amountPaid') + sum(disbursements.filter(d => d.paymentMethod === 'BANK_TRANSFER'), 'amount'),
      mobileMoney: sum(payments.filter(p => p.paymentMethod === 'MOBILE_MONEY'), 'amountPaid') + sum(disbursements.filter(d => d.paymentMethod === 'MOBILE_MONEY'), 'amount'),
      averagePayment: payments.length ? totalEncaissements / payments.length : 0,
      monthlyData,
      // New stats
      totalExpected,
      totalCollected,
      fullyPaidCount,
      partiallyPaidCount,
      collectionRate: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
    };
  }

  async getStudentFees(studentId: number) {
    const fees = await this.feeRepository.find({
      where: { student_id: studentId },
      relations: ['payments'],
      order: { created_at: 'DESC' },
    });

    return fees.map(fee => {
      const totalPaid = fee.payments
        ?.filter(p => !p.deletedAt && (p.status === 'ACTIVE' || !p.status))
        ?.reduce((sum, p) => sum + Number(p.amountPaid), 0) || 0;
      
      return {
        ...fee,
        total_paid: totalPaid,
        remaining: Math.max(0, Number(fee.total_due) - totalPaid),
      };
    });
  }

  async getStudentReport(studentId: number) {
    const fees = await this.getStudentFees(studentId);
    
    const totalDue = fees.reduce((sum, fee) => sum + Number(fee.total_due), 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.total_paid, 0);
    const remaining = Math.max(0, totalDue - totalPaid);

    const penalties = await this.paymentRepository.find({
      where: { 
        studentFeeId: In(fees.map(f => f.id)),
        status: Not('CANCELLED')
      },
      select: ['penalty'],
    });
    const totalPenalties = penalties.reduce((sum, p) => sum + Number(p.penalty), 0);

    return {
      student_id: studentId,
      summary: {
        total_due: totalDue,
        total_paid: totalPaid,
        remaining,
        total_penalties: totalPenalties,
        is_fully_paid: remaining <= 0,
      },
      fees,
    };
  }

  // ========== DISBURSEMENTS (DÉCAISSEMENTS) ==========

  async createDisbursement(dto: CreateDisbursementDto): Promise<Disbursement> {
    const disbursement = this.disbursementRepository.create({
      ...dto,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
    });

    const saved = await this.disbursementRepository.save(disbursement);
    this.logger.log(`Disbursement ${saved.id} recorded for ${saved.beneficiaryName}`);
    
    // Emit event
    this.client.emit('disbursement_created', saved);
    
    return saved;
  }

  async cancelDisbursement(id: number): Promise<Disbursement> {
    const disbursement = await this.disbursementRepository.findOne({ where: { id } });
    if (!disbursement) {
      throw new NotFoundException(`Décaissement avec l'ID ${id} non trouvé`);
    }
    if (disbursement.status === 'CANCELLED') {
      throw new BadRequestException('Ce décaissement est déjà annulé.');
    }

    disbursement.status = 'CANCELLED';
    const saved = await this.disbursementRepository.save(disbursement);
    
    this.logger.log(`Disbursement ${id} cancelled`);
    this.client.emit('disbursement_cancelled', id);
    return saved;
  }

  async findAllDisbursements(options: { page?: number; limit?: number; date?: string; q?: string; method?: string } = {}): Promise<PaginatedResult<Disbursement>> {
    const { page = 1, limit = 50, date, q, method } = options;
    const skip = (page - 1) * limit;

    const qb = this.disbursementRepository.createQueryBuilder('disbursement')
      .where('disbursement.deleted_at IS NULL');

    if (date) {
      const paymentDate = new Date(date);
      qb.andWhere('disbursement.paymentDate >= :start AND disbursement.paymentDate < :end', {
        start: paymentDate,
        end: new Date(paymentDate.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    if (method && method !== 'ALL') {
      qb.andWhere('disbursement.paymentMethod = :method', { method });
    }

    if (q) {
      qb.andWhere(
        '(CAST(disbursement.id AS TEXT) LIKE :query OR ' +
        'disbursement.beneficiaryName ILIKE :query OR ' +
        'disbursement.reference LIKE :query OR ' +
        'disbursement.description ILIKE :query)',
        { query: `%${q}%` }
      );
    }

    qb.orderBy('disbursement.paymentDate', 'DESC')
      .skip(skip)
      .take(limit);

    const [disbursements, total] = await qb.getManyAndCount();

    return {
      data: disbursements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDisbursementsByType(type: string, options: PaginationOptions = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [disbursements, total] = await this.disbursementRepository.findAndCount({
      where: { type: type as any },
      order: { paymentDate: 'DESC' },
      skip,
      take: limit,
      withDeleted: false,
    });

    return {
      data: disbursements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDisbursementStats(opts: { year?: number; month?: number }) {
    const { year, month } = opts;
    const qb = this.disbursementRepository.createQueryBuilder('disbursement');
    
    if (year !== undefined && year !== null) {
      qb.where('EXTRACT(YEAR FROM disbursement.payment_date) = :year', { year });
    }
    if (month !== undefined && month !== null) {
      const condition = qb.getQuery().includes('WHERE') ? 'andWhere' : 'where';
      qb[condition]('EXTRACT(MONTH FROM disbursement.payment_date) = :month', { month: month + 1 });
    }
    
    qb.andWhere('disbursement.deleted_at IS NULL');
    qb.andWhere('disbursement.status = :status', { status: 'ACTIVE' });
    const disbursements = await qb.getMany();

    const byType = {};
    disbursements.forEach(d => {
      if (!byType[d.type]) {
        byType[d.type] = { count: 0, total: 0 };
      }
      byType[d.type].count += 1;
      byType[d.type].total += Number(d.amount);
    });

    const totalAmount = disbursements.reduce((sum, d) => sum + Number(d.amount), 0);

    return {
      totalDisbursements: disbursements.length,
      totalAmount,
      byType,
      averageDisbursement: disbursements.length ? totalAmount / disbursements.length : 0,
    };
  }
}