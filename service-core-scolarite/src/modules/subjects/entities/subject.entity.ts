import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { Specialty } from '../../specialties/entities/specialty.entity';
import { SchoolClass } from '../../classes/entities/class.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'integer' })
  credits: number;

  // IMPORTANT: Match exact avec la colonne SQL 'specialty_id'
  @Column({ name: 'specialty_id', type: 'integer', nullable: true })
  specialtyId: number;

  @ManyToOne(() => Specialty)
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;

  @ManyToMany(() => SchoolClass, schoolClass => schoolClass.subjects)
  classes: SchoolClass[];
}