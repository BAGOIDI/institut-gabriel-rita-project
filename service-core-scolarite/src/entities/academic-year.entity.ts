import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Semester } from './semester.entity';

@Entity({ name: 'academic_years' })
export class AcademicYear {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: false })
  isCurrent: boolean;

  @OneToMany(() => Semester, semester => semester.academicYear)
  semesters: Semester[];
}