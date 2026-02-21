import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Class } from './class.entity';

@Entity({ name: 'specialties' })
export class Specialty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  code: string;

  @OneToMany(() => Class, classEntity => classEntity.specialty)
  classes: Class[];
}