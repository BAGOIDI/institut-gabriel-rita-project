import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Student } from './student.entity';
import { Payment } from './payment.entity';

@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ default: 'UNPAID' })
  status: string;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];
}