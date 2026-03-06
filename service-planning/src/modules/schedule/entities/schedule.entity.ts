import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classId: string;

  @Column()
  className: string;

  @Column()
  subjectId: string;

  @Column()
  subjectName: string;

  @Column()
  teacherId: string;

  @Column()
  teacherName: string;

  @Column()
  dayOfWeek: number; // 1 = Lundi, 7 = Dimanche

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ nullable: true })
  room: string;

  @Column({ default: true })
  isActive: boolean;
}
