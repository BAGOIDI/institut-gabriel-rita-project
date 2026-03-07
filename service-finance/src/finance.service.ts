import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Payment } from './finance/entities/payment.entity';
import { StudentFee } from './finance/entities/student-fee.entity';
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

  // -------------------------------------------------------
  // CRUD principal pour le frontend
  // -------------------------------------------------------

  // async findAll(opts: {
  //   page: number; limit: number; type?: string; method?: string;
  //   studentId?: string; year?: number; month?: number;
  // }) {
  //   const { page, limit, type, method, studentId, year, month } = opts;
  //   const qb = this.paymentRepository.createQueryBuilder('p')
  //     .orderBy('p.paymentDate', 'DESC');

  //   if (type && type !== 'ALL') qb.andWhere('p.type = :type', { type });
  //   if (method && method !== 'ALL') qb.andWhere('p.method = :method', { method });
  //   if (studentId) qb.andWhere('p.studentId = :studentId', { studentId });
  //   if (year) qb.andWhere('EXTRACT(YEAR FROM p.paymentDate) = :year', { year });
  //   if (month) qb.andWhere('EXTRACT(MONTH FROM p.paymentDate) = :month', { month: month + 1 });

  //   const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
  //   return { items, total, page, limit, lastPage: Math.ceil(total / limit) };
  // }

  // async createPaymentFull(dto: {
  //   studentId?: string;
  //   teacherId?: string;
  //   type?: 'ENCAISSEMENT' | 'DECAISSEMENT';
  //   amount: number;
  //   penalty?: number;
  //   discount?: number;
  //   method?: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  //   reference?: string;
  //   description?: string;
  //   paymentDate?: string;
  // }) {
  //   const payment = this.paymentRepository.create({
  //     studentId: dto.studentId,
  //     teacherId: dto.teacherId,
  //     type: dto.type || 'ENCAISSEMENT',
  //     amount: dto.amount,
  //     penalty: dto.penalty || 0,
  //     discount: dto.discount || 0,
  //     method: dto.method || 'CASH',
  //     reference: dto.reference,
  //     description: dto.description,
  //     paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
  //   });
  //   const saved = await this.paymentRepository.save(payment);
  //   this.logger.log(`Paiement créé: ${saved.id} - ${saved.amount} FCFA`);
  //   return saved;
  // }

  // async findOne(id: string): Promise<Payment> {
  //   const p = await this.paymentRepository.findOne({ where: { id } });
  //   if (!p) throw new NotFoundException(`Paiement ${id} introuvable`);
  //   return p;
  // }

  // async update(id: string, dto: any): Promise<Payment> {
  //   const p = await this.findOne(id);
  //   Object.assign(p, dto);
  //   return this.paymentRepository.save(p);
  // }

  // async remove(id: string): Promise<{ message: string }> {
  //   const p = await this.findOne(id);
  //   await this.paymentRepository.remove(p);
  //   return { message: `Paiement ${id} supprimé` };
  // }

  // async getStats(opts: { year?: number; month?: number }) {
  //   const { year, month } = opts;
  //   const qb = this.paymentRepository.createQueryBuilder('p');
  //   if (year) qb.where('EXTRACT(YEAR FROM p.paymentDate) = :year', { year });
  //   if (month) qb.andWhere('EXTRACT(MONTH FROM p.paymentDate) = :month', { month: month + 1 });

  //   const payments = await qb.getMany();
  //   const encaissements = payments.filter(p => p.type === 'ENCAISSEMENT');
  //   const decaissements = payments.filter(p => p.type === 'DECAISSEMENT');

  //   const sum = (arr: Payment[], field: keyof Payment) =>
  //     arr.reduce((acc, p) => acc + Number(p[field] || 0), 0);

  //   return {
  //     totalPayments: payments.length,
  //     totalEncaissements: sum(encaissements, 'amount'),
  //     totalDecaissements: sum(decaissements, 'amount'),
  //     netAmount: sum(encaissements, 'amount') - sum(decaissements, 'amount'),
  //     totalPenalties: sum(payments, 'penalty'),
  //     totalDiscounts: sum(payments, 'discount'),
  //     cashPayments: payments.filter(p => p.method === 'CASH').length,
  //     bankTransfers: payments.filter(p => p.method === 'BANK_TRANSFER').length,
  //     mobileMoney: payments.filter(p => p.method === 'MOBILE_MONEY').length,
  //     averagePayment: payments.length ? sum(payments, 'amount') / payments.length : 0,
  //   };
  // }

  // -------------------------------------------------------
  // Routes legacy
  // -------------------------------------------------------

  // async recordPayment(dto: CreatePaymentDto) {
  //   const fee = await this.feeRepository.findOne({ where: { id: dto.studentFeeId } });
  //   if (!fee) throw new NotFoundException(`StudentFee ${dto.studentFeeId} introuvable`);
  //   const payment = this.paymentRepository.create({
  //     amount: dto.amount,
  //     method: dto.method,
  //     studentId: dto.userId,
  //   });
  //   await this.paymentRepository.save(payment);
  //   return { status: 'success', paymentId: payment.id };
  // }

  // async getStudentBalance(studentId: number) {
  //   const result = await this.feeRepository.createQueryBuilder('fee')
  //     .leftJoinAndSelect('fee.payments', 'payment')
  //     .where('fee.student_id = :studentId', { studentId })
  //     .getMany();
  //   if (!result.length) return { message: 'Aucune scolarité pour cet étudiant', balance: 0 };
  //   return result.map(fee => {
  //     const paid = (fee.payments || []).reduce((s, p: any) => s + Number(p.amount_paid || p.amount), 0);
  //     return { feeId: fee.id, totalDue: Number(fee.total_due), paid, balance: Number(fee.total_due) - paid };
  //   });
  // }

  // async getGlobalReport() {
  //   const result = await this.dataSource.query(`
  //     SELECT
  //       SUM(sf.total_due) as total_expected,
  //       SUM(p.amount_paid) as total_collected
  //     FROM finance_student_fees sf
  //     LEFT JOIN finance_payments p ON sf.id = p.student_fee_id
  //   `);
  //   const expected = Number(result[0]?.total_expected || 0);
  //   const collected = Number(result[0]?.total_collected || 0);
  //   return { total_expected: expected, total_collected: collected, total_outstanding: expected - collected };
  // }
}
