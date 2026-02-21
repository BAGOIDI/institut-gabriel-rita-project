import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'staff' })
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.staffProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  department: string;

  @Column({ default: true })
  isActive: boolean;
}