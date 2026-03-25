import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Payment } from './payment.entity';

@Entity('finance_student_fees')
export class StudentFee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @Column({ name: 'fee_type_id', nullable: true })
  fee_type_id: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_due: number;

  @Column({ name: 'is_fully_paid', default: false })
  is_fully_paid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Payment, (payment) => payment.studentFee)
  payments: Payment[];
}