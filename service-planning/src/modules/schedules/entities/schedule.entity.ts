import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('course_schedules')
export class CourseSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'staff_id', type: 'integer' })
  staffId: number;

  @Column({ name: 'subject_id', type: 'integer' })
  subjectId: number;

  @Column({ name: 'class_id', type: 'integer' })
  classId: number;

  @Column({ name: 'room_name', type: 'varchar', length: 50, nullable: true })
  roomName: string;

  @Column({ name: 'day_of_week', type: 'integer' })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'academic_year_id', type: 'integer', nullable: true })
  academicYearId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}