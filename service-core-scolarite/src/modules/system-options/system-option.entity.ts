import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_options')
export class SystemOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category: string;

  @Column()
  value: string;

  // Nullable to avoid failing schema sync on existing rows
  @Column({ name: 'label_fr', nullable: true })
  labelFr: string | null;

  // Nullable to avoid failing schema sync on existing rows
  @Column({ name: 'label_en', nullable: true })
  labelEn: string | null;

  @Column({ nullable: true })
  label: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
