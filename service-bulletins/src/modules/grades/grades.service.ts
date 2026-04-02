import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeEntity } from './entities/grade.entity';
import { BulkUpsertGradesDto } from './dto/bulk-upsert-grades.dto';

export interface GradeFilters {
  studentId?: number;
  evaluationId?: number;
}

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(GradeEntity)
    private readonly repo: Repository<GradeEntity>,
  ) {}

  async create(dto: CreateGradeDto): Promise<GradeEntity> {
    const entity = this.repo.create({
      ...dto,
      isAbsent: dto.isAbsent ?? false,
      updatedAt: new Date(),
    });
    return await this.repo.save(entity);
  }

  async findAll(filters: GradeFilters = {}): Promise<GradeEntity[]> {
    const where: FindOptionsWhere<GradeEntity> = {};
    if (filters.studentId != null) where.studentId = filters.studentId;
    if (filters.evaluationId != null) where.evaluationId = filters.evaluationId;
    return await this.repo.find({
      where,
      order: { studentId: 'ASC', evaluationId: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<GradeEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Grade ${id} not found`);
    return entity;
  }

  async update(id: number, dto: UpdateGradeDto): Promise<GradeEntity> {
    const entity = await this.repo.preload({
      id,
      ...dto,
      updatedAt: new Date(),
    });
    if (!entity) throw new NotFoundException(`Grade ${id} not found`);
    return await this.repo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }

  async bulkUpsert(dto: BulkUpsertGradesDto): Promise<{ upserted: number }> {
    if (!dto.items?.length) return { upserted: 0 };

    // Upsert by unique (studentId, evaluationId)
    const rows = dto.items.map((i) =>
      this.repo.create({
        studentId: i.studentId,
        evaluationId: i.evaluationId,
        score: i.score ?? null,
        isAbsent: i.isAbsent ?? false,
        comments: i.comments ?? null,
        updatedAt: new Date(),
        updatedBy: dto.updatedBy ?? null,
      }),
    );

    await this.repo.upsert(rows, {
      conflictPaths: ['studentId', 'evaluationId'], // Property names are usually enough
      skipUpdateIfNoValuesChanged: false,
    });

    return { upserted: rows.length };
  }
}

