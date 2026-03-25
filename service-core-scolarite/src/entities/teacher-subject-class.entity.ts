import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Staff } from './staff.entity';
import { Subject } from './subject.entity';
import { Class } from './class.entity';
import { AcademicYear } from './academic-year.entity';
import { Semester } from './semester.entity';

@Entity({ name: 'teacher_subject_class' })
export class TeacherSubjectClass {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Staff, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @Column({ name: 'staff_id' })
  staffId: number;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id' })
  subjectId: number;

  @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'class_id' })
  classId: number;

  @ManyToOne(() => AcademicYear, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: number;

  @ManyToOne(() => Semester, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @Column({ name: 'semester_id', nullable: true })
  semesterId: number;

  @Column({ name: 'cota_minsup', nullable: true })
  cotaMinsup: number;

  @Column({ name: 'cota_isgr', nullable: true })
  cotaIsgr: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'hourly_rate', nullable: true })
  hourlyRate: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
