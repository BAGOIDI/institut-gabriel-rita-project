import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { TeacherSubjectClass } from '../../entities/teacher-subject-class.entity';

@Injectable()
export class TeacherSubjectClassService {
  constructor(
    @InjectRepository(TeacherSubjectClass)
    private readonly repository: Repository<TeacherSubjectClass>,
  ) {}

  async findAll(query?: { 
    staffId?: number; 
    subjectId?: number; 
    classId?: number;
    academicYearId?: number;
  }): Promise<TeacherSubjectClass[]> {
    const qb = this.repository.createQueryBuilder('tsc')
      .leftJoinAndSelect('tsc.staff', 'staff')
      .leftJoinAndSelect('tsc.subject', 'subject')
      .leftJoinAndSelect('tsc.class', 'class')
      .leftJoinAndSelect('tsc.academicYear', 'academicYear')
      .leftJoinAndSelect('tsc.semester', 'semester');

    if (query?.staffId) {
      qb.andWhere('tsc.staff_id = :staffId', { staffId: query.staffId });
    }
    if (query?.subjectId) {
      qb.andWhere('tsc.subject_id = :subjectId', { subjectId: query.subjectId });
    }
    if (query?.classId) {
      qb.andWhere('tsc.class_id = :classId', { classId: query.classId });
    }
    if (query?.academicYearId) {
      qb.andWhere('tsc.academic_year_id = :academicYearId', { academicYearId: query.academicYearId });
    }

    return await qb.getMany();
  }

  async findOne(id: number): Promise<TeacherSubjectClass> {
    const found = await this.repository.findOne({ 
      where: { id },
      relations: ['staff', 'subject', 'class', 'academicYear', 'semester']
    });
    if (!found) {
      throw new NotFoundException(`TeacherSubjectClass with ID ${id} not found`);
    }
    return found;
  }

  async create(data: DeepPartial<TeacherSubjectClass>): Promise<TeacherSubjectClass> {
    const created = this.repository.create(data);
    return await this.repository.save(created);
  }

  async update(id: number, data: DeepPartial<TeacherSubjectClass>): Promise<TeacherSubjectClass> {
    const found = await this.findOne(id);
    const updated = this.repository.merge(found, data);
    return await this.repository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const found = await this.findOne(id);
    await this.repository.remove(found);
  }

  async syncTeacherAssignments(staffId: number, assignments: { classId: number; subjectId: number }[]): Promise<TeacherSubjectClass[]> {
    // 1. Delete all current assignments for this teacher
    await this.repository.delete({ staffId });

    // 2. Create new ones
    if (assignments.length === 0) return [];

    const entities = assignments.map(a => this.repository.create({
      staffId,
      classId: a.classId,
      subjectId: a.subjectId,
    }));

    return await this.repository.save(entities);
  }

  // Helper methods for dynamic filtering
  async findTeachersByClass(classId: number): Promise<any[]> {
    const relations = await this.findAll({ classId });
    // Extract unique teachers
    const teachersMap = new Map();
    relations.forEach(r => {
      if (r.staff) {
        teachersMap.set(r.staff.id, r.staff);
      }
    });
    return Array.from(teachersMap.values());
  }

  async findSubjectsByClass(classId: number): Promise<any[]> {
    const relations = await this.findAll({ classId });
    // Extract unique subjects
    const subjectsMap = new Map();
    relations.forEach(r => {
      if (r.subject) {
        subjectsMap.set(r.subject.id, r.subject);
      }
    });
    return Array.from(subjectsMap.values());
  }

  async findClassesByTeacher(staffId: number): Promise<any[]> {
    const relations = await this.findAll({ staffId });
    const classesMap = new Map();
    relations.forEach(r => {
      if (r.class) {
        classesMap.set(r.class.id, r.class);
      }
    });
    return Array.from(classesMap.values());
  }

  async findSubjectsByTeacher(staffId: number): Promise<any[]> {
    const relations = await this.findAll({ staffId });
    const subjectsMap = new Map();
    relations.forEach(r => {
      if (r.subject) {
        subjectsMap.set(r.subject.id, r.subject);
      }
    });
    return Array.from(subjectsMap.values());
  }
}
