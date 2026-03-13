import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn() id: number;
  @Column() matricule: string;
  @Column() first_name: string;
  @Column() last_name: string;
}