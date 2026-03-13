import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nullable pour éviter l'échec de synchronize si des lignes existantes ont name = NULL
  @Column({ unique: true, nullable: true })
  name: string | null;

  @Column('jsonb', { nullable: true })
  permissions: any;

  @Column('text', { nullable: true })
  description: string;

  @OneToMany(() => User, user => user.role)
  users: User[];
}