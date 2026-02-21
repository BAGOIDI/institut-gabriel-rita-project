import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'PENDING' })
  status: string;
}
