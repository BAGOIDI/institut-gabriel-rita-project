import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationEntity, EvaluationStatus, EvaluationType } from './entities/evaluation.entity';

export interface EvaluationFilters {
  subjectId?: number;
  academicYearId?: number;
  semesterId?: number;
  type?: EvaluationType;
  status?: EvaluationStatus;
}

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(EvaluationEntity)
    private readonly repo: Repository<EvaluationEntity>,
  ) {}

  async create(dto: CreateEvaluationDto): Promise<EvaluationEntity> {
    const entity = this.repo.create({
      ...dto,
      weightPercent: dto.weightPercent ?? 100,
      maxScore: dto.maxScore ?? '20.00',
      status: dto.status ?? 'DRAFT',
    });
    return await this.repo.save(entity);
  }

  async findAll(filters: EvaluationFilters = {}): Promise<EvaluationEntity[]> {
    const where: FindOptionsWhere<EvaluationEntity> = {};
    if (filters.subjectId != null) where.subjectId = filters.subjectId;
    if (filters.academicYearId != null) where.academicYearId = filters.academicYearId;
    if (filters.semesterId != null) where.semesterId = filters.semesterId;
    if (filters.type != null) where.type = filters.type;
    if (filters.status != null) where.status = filters.status;

    return await this.repo.find({
      where,
      order: { subjectId: 'ASC', type: 'ASC', name: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<EvaluationEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Evaluation ${id} not found`);
    return entity;
  }

  async update(id: number, dto: UpdateEvaluationDto): Promise<EvaluationEntity> {
    const entity = await this.repo.preload({ id, ...dto });
    if (!entity) throw new NotFoundException(`Evaluation ${id} not found`);
    return await this.repo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}

