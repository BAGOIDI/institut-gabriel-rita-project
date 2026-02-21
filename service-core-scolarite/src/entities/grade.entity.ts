import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Subject } from './subject.entity';

@Entity({ name: 'grades' })
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ default: false })
  isAbsent: boolean;

  @Column({ type: 'text', nullable: true })
  comments: string;
}