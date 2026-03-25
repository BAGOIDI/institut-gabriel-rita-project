import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { StudentFee } from './student-fee.entity';

@Entity('finance_payment_plans')
export class PaymentPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_fee_id' })
  student_fee_id: number;

  @Column({ type: 'date' })
  due_date: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount_expected: number;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, PAID, OVERDUE

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => StudentFee, (fee) => fee.payments)
  @JoinColumn({ name: 'student_fee_id' })
  studentFee: StudentFee;
}
