import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { Class } from '../../entities/class.entity';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  lastPage: number;
}

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) {}

  async create(data: any): Promise<Student> {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      parentPhoneNumber,
      photo,
      classRoom,
    } = data || {};

    if (!firstName || !lastName) {
      throw new BadRequestException('firstName and lastName are required');
    }

    const generatedMatricule =
      data?.matricule ||
      `STU-${Date.now().toString(36).toUpperCase()}`;

    let classEntity: Class | null = null;
    if (classRoom) {
      classEntity = await this.classRepository.findOne({ where: { name: classRoom } });
    }

    const student = this.studentRepository.create({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      matricule: generatedMatricule,
       class: classEntity || null,
      // Align front fields with entity columns when possible
      phone: phoneNumber,
      parentPhone: parentPhoneNumber,
      photoUrl: photo,
    });
    const savedStudent = await this.studentRepository.save(student);
    this.client.emit('student.created', savedStudent);
    return savedStudent;
  }

  private normalizePagination(options: PaginationOptions = {}): Required<PaginationOptions> {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    return {
      page: page < 1 ? 1 : page,
      limit: limit < 1 ? 10 : limit,
    };
  }

  private async getPaginatedResult(
    where: Record<string, any> = {},
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Student>> {
    const { page, limit } = this.normalizePagination(options);

    const [items, total] = await this.studentRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    const lastPage = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      items,
      total,
      lastPage,
    };
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<Student>> {
    return this.getPaginatedResult({}, options);
  }

  async search(
    q: string | undefined,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Student>> {
    const { page, limit } = this.normalizePagination(options);

    const query = this.studentRepository
      .createQueryBuilder('student')
      .orderBy('student.lastName', 'ASC')
      .addOrderBy('student.firstName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q && q.trim() !== '') {
      const term = `%${q.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(student.firstName) LIKE :term OR LOWER(student.lastName) LIKE :term OR LOWER(student.matricule) LIKE :term)',
        { term },
      );
    }

    const [items, total] = await query.getManyAndCount();
    const lastPage = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      items,
      total,
      lastPage,
    };
  }

  async findOne(id: string): Promise<Student> {
    const numericId = Number(id);
    const student = await this.studentRepository.findOne({ where: { id: numericId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async update(id: string, updateStudentDto: any): Promise<Student> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      throw new BadRequestException(`Invalid student id: ${id}`);
    }

    let classEntity: Class | null = null;
    if ((updateStudentDto as any).classRoom) {
      classEntity = await this.classRepository.findOne({
        where: { name: (updateStudentDto as any).classRoom },
      });
    }

    const student = await this.studentRepository.preload({
      id: numericId,
      ...updateStudentDto,
      phone: (updateStudentDto as any).phoneNumber,
      parentPhone: (updateStudentDto as any).parentPhoneNumber,
      photoUrl: (updateStudentDto as any).photo,
      class: classEntity ?? undefined,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    const savedStudent = await this.studentRepository.save(student);
    this.client.emit('student.created', savedStudent);
    return savedStudent;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
    return { deleted: true };
  }

  async importFromJson(rows: any[]): Promise<{ imported: number }> {
    if (!Array.isArray(rows)) {
      return { imported: 0 };
    }

    let count = 0;

    for (const row of rows) {
      const student = this.studentRepository.create({
        matricule: row['Matricule'] || `MAT-${Date.now()}-${count}`,
        firstName: row['Prenom'] || '',
        lastName: row['Nom'] || 'Inconnu',
      });

      const savedStudent = await this.studentRepository.save(student);
      this.client.emit('student.created', savedStudent);
      count++;
    }

    return { imported: count };
  }
}
