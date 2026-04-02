import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type EvaluationType = 'CC' | 'SN' | 'RA' | 'TP' | 'PROJET';
export type EvaluationStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

@Entity({ name: 'evaluations' })
export class EvaluationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subject_id', type: 'int' })
  subjectId: number;

  @Column({ name: 'academic_year_id', type: 'int' })
  academicYearId: number;

  @Column({ name: 'semester_id', type: 'int' })
  semesterId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: EvaluationType;

  @Column({ name: 'weight_percent', type: 'int', default: 100 })
  weightPercent: number;

  @Column({ name: 'max_score', type: 'numeric', precision: 5, scale: 2, default: 20 })
  maxScore: string;

  @Column({ type: 'date', nullable: true })
  date?: string;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status: EvaluationStatus;
}

