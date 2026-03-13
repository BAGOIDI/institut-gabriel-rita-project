import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../../entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subjects.dto';
import { UpdateSubjectDto } from './dto/update-subjects.dto';

@Injectable()
export class SubjectService implements OnModuleInit {
  private readonly logger = new Logger(SubjectService.name);

  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  async onModuleInit() {
    const colorMap: Record<string, { color: string; backgroundColor: string }> = {
      'Mathématiques': { color: '#3b82f6', backgroundColor: '#eff6ff' },
      'Physique-Chimie': { color: '#8b5cf6', backgroundColor: '#f5f3ff' },
      'Français': { color: '#ec4899', backgroundColor: '#fdf2f8' },
      'Anglais': { color: '#f59e0b', backgroundColor: '#fffbeb' },
      'SVT': { color: '#10b981', backgroundColor: '#f0fdf4' },
      'Histoire-Géo': { color: '#f97316', backgroundColor: '#fff7ed' },
      'EPS': { color: '#06b6d4', backgroundColor: '#ecfeff' },
      'Philosophie': { color: '#6366f1', backgroundColor: '#eef2ff' },
      'Informatique': { color: '#14b8a6', backgroundColor: '#f0fdfa' },
    };

    try {
      let subjects = await this.subjectRepository.find();
      if (subjects.length === 0) {
        const base = [
          { name: 'Mathématiques', code: 'MATH' },
          { name: 'Physique-Chimie', code: 'PHY-CHI' },
          { name: 'Français', code: 'FR' },
          { name: 'Anglais', code: 'EN' },
          { name: 'SVT', code: 'SVT' },
          { name: 'Histoire-Géo', code: 'HG' },
          { name: 'EPS', code: 'EPS' },
          { name: 'Philosophie', code: 'PHILO' },
          { name: 'Informatique', code: 'INFO' },
        ] as Partial<Subject>[];
        const withColors = base.map(s => ({
          ...s,
          color: colorMap[s.name!]?.color || '#3b82f6',
          backgroundColor: colorMap[s.name!]?.backgroundColor || '#eff6ff',
          creditsEcts: 0,
          coefficient: 1,
        })) as Partial<Subject>[];
        const entities = this.subjectRepository.create(withColors);
        await this.subjectRepository.save(entities);
        subjects = await this.subjectRepository.find();
        this.logger.log(`Création de ${entities.length} matières de test.`);
      }
      let updated = 0;
      for (const s of subjects) {
        if (!s.color || !s.backgroundColor) {
          const defaults = colorMap[s.name] || { color: '#3b82f6', backgroundColor: '#eff6ff' };
          s.color = s.color || defaults.color;
          s.backgroundColor = s.backgroundColor || defaults.backgroundColor;
          await this.subjectRepository.save(s);
          updated++;
        }
      }
      if (updated > 0) {
        this.logger.log(`Couleurs par défaut appliquées à ${updated} matière(s).`);
      }
    } catch (e) {
      this.logger.warn(`Impossible d'initialiser les couleurs des matières: ${e?.message || e}`);
    }
  }

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepository.create(createSubjectDto);
    return await this.subjectRepository.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return await this.subjectRepository.find({
      relations: ['class', 'teacher']
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.subjectRepository.preload({
      id: id,
      ...updateSubjectDto,
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return await this.subjectRepository.save(subject);
  }

  async remove(id: string): Promise<void> {
    const subject = await this.findOne(id);
    await this.subjectRepository.remove(subject);
  }
}
