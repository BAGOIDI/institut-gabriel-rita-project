import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Subject } from './subject.entity';

@Entity({ name: 'staff' })
export class Staff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  matricule: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'place_of_birth', nullable: true })
  placeOfBirth: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ name: 'marital_status', nullable: true })
  maritalStatus: string;

  @Column({ name: 'id_card_number', nullable: true })
  idCardNumber: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'emergency_contact', nullable: true })
  emergencyContact: string;

  @Column({ nullable: true })
  specialty: string;

  @Column({ nullable: true })
  diploma: string;

  @Column({ type: 'date', name: 'hire_date', nullable: true })
  hireDate: Date;

  @Column({ name: 'contract_type', nullable: true })
  contractType: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ name: 'social_security_number', nullable: true })
  socialSecurityNumber: string;

  @Column({ name: 'bank_account', nullable: true })
  bankAccount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'hourly_rate', default: 0 })
  hourlyRate: number;

  @Column({ name: 'biometric_id', nullable: true })
  biometricId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => User, user => user.staffProfile, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Subject, subject => subject.teacher)
  subjects: Subject[];
}
