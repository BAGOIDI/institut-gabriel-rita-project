import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Class } from '../../entities/class.entity';

@Entity({ name: 'campuses' })
export class Campus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  city: string;

  @Column('text', { nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => Class, classEntity => classEntity.campus)
  classes: Class[];
}