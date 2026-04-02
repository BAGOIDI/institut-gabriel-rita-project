import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'grades' })
@Index(['studentId', 'evaluationId'], { unique: true })
export class GradeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId: number;

  @Column({ name: 'evaluation_id', type: 'int' })
  evaluationId: number;

  @Column({ name: 'anonymity_code', type: 'varchar', length: 50, nullable: true, unique: true })
  anonymityCode?: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score?: string;

  @Column({ name: 'is_absent', type: 'bool', default: false })
  isAbsent: boolean;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string;
}

