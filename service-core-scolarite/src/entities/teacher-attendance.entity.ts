import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity({ name: 'teacher_attendances' })
export class TeacherAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', nullable: true })
  arrivalTime: string;

  @Column({ type: 'time', nullable: true })
  departureTime: string;

  @Column({ type: 'enum', enum: ['PRESENT', 'LATE', 'ABSENT'], default: 'PRESENT' })
  status: string;

  @Column('int', { name: 'delay_minutes', default: 0 })
  delayMinutes: number;

  @CreateDateColumn()
  createdAt: Date;
}
