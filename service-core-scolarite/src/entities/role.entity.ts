import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('jsonb', { nullable: true })
  permissions: any;

  @Column('text', { nullable: true })
  description: string;

  @OneToMany(() => User, user => user.role)
  users: User[];
}