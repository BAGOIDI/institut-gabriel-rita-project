import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Specialty } from './specialty.entity';
import { AcademicYear } from './academic-year.entity';
import { Campus } from '../modules/campus/campus.entity';
import { Student } from './student.entity';
import { Subject } from './subject.entity';

@Entity({ name: 'classes' })
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tuitionFee: number;

  @ManyToOne(() => Specialty, { nullable: true })
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;

  @ManyToOne(() => AcademicYear, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @ManyToOne(() => Campus, { nullable: true })
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @OneToMany(() => Student, student => student.class)
  students: Student[];

  @OneToMany(() => Subject, subject => subject.class)
  subjects: Subject[];
}