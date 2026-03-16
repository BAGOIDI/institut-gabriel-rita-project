import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Class } from './class.entity';
import { Semester } from './semester.entity';
import { Grade } from './grade.entity';
import { Staff } from './staff.entity';

@Entity({ name: 'subjects' })
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ name: 'background_color', nullable: true })
  backgroundColor?: string;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Staff;

  @ManyToOne(() => Semester, { nullable: true })
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @Column({ default: 1 })
  coefficient: number;

  @Column({ default: 0 })
  creditsEcts: number;

  @OneToMany(() => Grade, grade => grade.subject)
  grades: Grade[];
}
