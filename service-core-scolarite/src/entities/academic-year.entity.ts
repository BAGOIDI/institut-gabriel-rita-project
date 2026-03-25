import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Semester } from './semester.entity';

@Entity({ name: 'academic_years' })
export class AcademicYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Nullable pour éviter l'échec de synchronize sur des lignes existantes sans dates
  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  // Nullable pour éviter l'échec de synchronize sur des lignes existantes sans dates
  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ default: false })
  isCurrent: boolean;

  @OneToMany(() => Semester, semester => semester.academicYear)
  semesters: Semester[];
}