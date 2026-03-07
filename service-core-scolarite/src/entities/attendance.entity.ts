import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  JoinColumn, CreateDateColumn
} from 'typeorm';
import { Staff } from './staff.entity';

@Entity({ name: 'attendance' })
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Staff, { eager: true })
  @JoinColumn({ name: 'staff_id' })
  teacher: Staff;

  @Column({ name: 'staff_id' })
  staffId: string;

  @Column({ type: 'timestamp', nullable: true, name: 'check_in' })
  checkIn: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'check_out' })
  checkOut: Date;

  @Column({ name: 'is_late', default: false })
  isLate: boolean;

  @Column({ name: 'late_minutes', default: 0 })
  lateMinutes: number;

  @Column({
    type: 'enum',
    enum: ['PRESENT', 'ABSENT', 'LATE'],
    default: 'PRESENT',
  })
  status: 'PRESENT' | 'ABSENT' | 'LATE';

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
