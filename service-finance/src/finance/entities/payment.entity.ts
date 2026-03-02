import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StudentFee } from './student-fee.entity';

@Entity('finance_payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount_paid: number;

  @Column()
  payment_method: string;

  @Column()
  recorded_by: number;

  @CreateDateColumn()
  payment_date: Date;

  @ManyToOne(() => StudentFee, (fee) => fee.payments)
  @JoinColumn({ name: 'student_fee_id' })
  studentFee: StudentFee;

  @Column()
  student_fee_id: number;
}