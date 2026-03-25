import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AcademicYear } from './academic-year.entity';
import { Subject } from './subject.entity';

@Entity({ name: 'semesters' })
export class Semester {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => AcademicYear, academicYear => academicYear.semesters)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @OneToMany(() => Subject, subject => subject.semester)
  subjects: Subject[];
}