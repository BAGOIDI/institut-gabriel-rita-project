import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Specialty } from '../../specialties/entities/specialty.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('classes')
export class SchoolClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  level: string;

  // IMPORTANT: Match exact avec la colonne SQL 'specialty_id'
  @Column({ name: 'specialty_id', type: 'integer' })
  specialtyId: number;

  @Column({ type: 'integer', default: 50 })
  capacity: number;

  @ManyToOne(() => Specialty)
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;

  @ManyToMany(() => Subject, subject => subject.classes)
  @JoinTable({
    name: 'class_subjects',
    joinColumn: { name: 'class_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'subject_id', referencedColumnName: 'id' },
  })
  subjects: Subject[];
}