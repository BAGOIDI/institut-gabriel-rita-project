import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('payroll_slips')
export class PayrollSlip {
  @PrimaryGeneratedColumn() id: number;
  @Column() staff_id: number;
  @Column() month: string; // ex: '2023-10'
  @Column('decimal') base_salary: number;
  @Column('decimal') hourly_rate: number;
  @Column('decimal') hours_worked: number;
  @Column('decimal') delay_penalties: number;
  @Column('decimal') net_salary: number;
  @CreateDateColumn() created_at: Date;
}