import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Role } from './role.entity';
import { Campus } from '../modules/campus/campus.entity';
import { Staff } from './staff.entity';
import { Student } from './student.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Campus, { nullable: true })
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @OneToOne(() => Staff, staff => staff.user, { nullable: true })
  @JoinColumn({ name: 'staff_profile_id' })
  staffProfile: Staff;

  @OneToOne(() => Student, student => student.user, { nullable: true })
  studentProfile: Student;
}