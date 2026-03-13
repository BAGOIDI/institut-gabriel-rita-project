import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Class } from './class.entity';

@Entity({ name: 'specialties' })
export class Specialty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Class, classEntity => classEntity.specialty)
  classes: Class[];
}