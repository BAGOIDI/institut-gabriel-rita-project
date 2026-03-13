import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('finance_student_fees')
export class FinanceStudentFee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'integer' })
  studentId: number;

  @Column({ name: 'fee_type_id', type: 'integer' })
  feeTypeId: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_due', type: 'decimal', precision: 10, scale: 2 })
  totalDue: number;

  @Column({ name: 'is_fully_paid', type: 'boolean', default: false })
  isFullyPaid: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}