import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Payment } from './payment.entity';

@Entity('finance_student_fees')
export class StudentFee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_due: number;

  @OneToMany(() => Payment, (payment) => payment.studentFee)
  payments: Payment[];
}