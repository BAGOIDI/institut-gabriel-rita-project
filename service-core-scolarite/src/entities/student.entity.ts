import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Class } from './class.entity';
import { Invoice } from './invoice.entity';
import { Grade } from './grade.entity';

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  matricule: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ length: 20, nullable: true })
  gender: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: 'parent_phone_number', length: 20, nullable: true })
  parentPhone: string;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'special_status', length: 100, nullable: true })
  specialStatus: string;

  @Column({ name: 'photo', type: 'text', nullable: true })
  photoUrl: string;

  @OneToMany(() => Invoice, invoice => invoice.student)
  invoices: Invoice[];

  @OneToMany(() => Grade, grade => grade.student)
  grades: Grade[];
}