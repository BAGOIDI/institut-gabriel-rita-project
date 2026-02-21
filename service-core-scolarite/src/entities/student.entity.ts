import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Class } from './class.entity';
import { Invoice } from './invoice.entity';
import { Grade } from './grade.entity';

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true })
  matricule: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ length: 1, nullable: true })
  gender: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  parentPhone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Invoice, invoice => invoice.student)
  invoices: Invoice[];

  @OneToMany(() => Grade, grade => grade.student)
  grades: Grade[];
}