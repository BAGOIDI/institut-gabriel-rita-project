import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Bulletin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;
  
  @Column()
  term: string;
}
