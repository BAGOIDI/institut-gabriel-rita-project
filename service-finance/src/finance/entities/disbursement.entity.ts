import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn } from 'typeorm';

export enum DisbursementType {
  SALARY = 'SALARY', // Salaire professeur
  SUPPLIES = 'SUPPLIES', // Fournitures
  MAINTENANCE = 'MAINTENANCE', // Maintenance
  UTILITIES = 'UTILITIES', // Factures (eau, électricité)
  OTHER = 'OTHER', // Autre
}

@Entity('finance_disbursements')
export class Disbursement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'type' })
  type: DisbursementType;

  @Column('decimal', { name: 'amount', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'beneficiary_name' })
  beneficiaryName: string;

  @Column({ name: 'beneficiary_id', nullable: true })
  beneficiaryId: number; // ID staff ou autre

  @Column({ name: 'period', nullable: true })
  period: string; // Ex: "Octobre 2024" pour salaire

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'payment_method' })
  paymentMethod: string; // CASH, BANK_TRANSFER, MOBILE_MONEY

  @Column({ name: 'reference', nullable: true })
  reference: string;

  @Column({ name: 'recorded_by' })
  recordedBy: number; // ID utilisateur

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string; // ACTIVE, CANCELLED

  @Column({ type: 'timestamp', name: 'payment_date', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
