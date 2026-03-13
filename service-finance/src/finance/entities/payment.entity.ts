import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { StudentFee } from './student-fee.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('finance_payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  reference: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount_paid: number;

  @Column()
  payment_method: string;

  @Column()
  recorded_by: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.COMPLETED })
  status: PaymentStatus;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  payment_date: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => StudentFee, (fee) => fee.payments)
  @JoinColumn({ name: 'student_fee_id' })
  studentFee: StudentFee;

  @Column()
  student_fee_id: number;
}