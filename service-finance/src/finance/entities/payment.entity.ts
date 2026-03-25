import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';
import { StudentFee } from './student-fee.entity';

@Entity('finance_payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_fee_id', nullable: true })
  studentFeeId: number;

  @Column({ name: 'student_name', nullable: true })
  studentName: string;

  @Column({ name: 'student_matricule', nullable: true })
  studentMatricule: string;

  @Column('decimal', { name: 'amount_paid', precision: 10, scale: 2 })
  amountPaid: number;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string; // CASH, BANK_TRANSFER, MOBILE_MONEY

  @Column({ type: 'timestamp', name: 'payment_date', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;

  @Column({ name: 'recorded_by', nullable: true })
  recordedBy: number;

  @Column({ name: 'receipt_number', nullable: true, unique: true })
  receiptNumber: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Champs additionnels pour gestion avancée
  @Column({ type: 'varchar', nullable: true })
  type: string; // ENCAISSEMENT ou DECAISSEMENT

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  penalty: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ nullable: true })
  reference: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string; // ACTIVE, CANCELLED

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => StudentFee, (fee) => fee.payments, { nullable: true })
  @JoinColumn({ name: 'student_fee_id' })
  studentFee: StudentFee;
}