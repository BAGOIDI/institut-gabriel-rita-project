import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity({ name: 'payslips' })
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @Column()
  month: number;

  @Column()
  year: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  grossSalary: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deductions: number;

  @Column('decimal', { precision: 10, scale: 2 })
  netSalary: number;

  @Column({ default: 'DRAFT' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
