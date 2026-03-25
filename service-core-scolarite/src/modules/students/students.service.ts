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

type StudentListItem = {
  id: number;
  matricule: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
  dateOfBirth?: Date | null;
  phoneNumber?: string | null;
  parentPhoneNumber?: string | null;
  email?: string | null;
  classRoom?: string | null;
  specialStatus?: string | null;
  photo?: string | null;
};

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) {}

  private toListItem(s: Student): StudentListItem {
    return {
      id: s.id,
      matricule: s.matricule,
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender ?? null,
      dateOfBirth: (s as any).dateOfBirth ?? null,
      phoneNumber: (s as any).phone ?? null,
      parentPhoneNumber: (s as any).parentPhone ?? null,
      email: s.email ?? null,
      classRoom: (s as any).class?.name ?? null,
      specialStatus: (s as any).specialStatus ?? null,
      photo: s.photo ?? null,
    };
  }

  async create(data: any): Promise<StudentListItem> {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      parentPhoneNumber,
      photo,
      classRoom,
      specialStatus,
    } = data || {};

    if (!lastName) {
      throw new BadRequestException('lastName is required');
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
      specialStatus,
      photo: photo,
    });
    const savedStudent = await this.studentRepository.save(student) as Student;
    this.client.emit('student.created', savedStudent);
    const withClass = await this.studentRepository.findOne({
      where: { id: savedStudent.id },
      relations: { class: true },
    });
    return this.toListItem(withClass || savedStudent);
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
  ): Promise<PaginatedResult<StudentListItem>> {
    const { page, limit } = this.normalizePagination(options);

    const [items, total] = await this.studentRepository.findAndCount({
      where,
      relations: { class: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    const lastPage = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      items: items.map((s) => this.toListItem(s)),
      total,
      lastPage,
    };
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<StudentListItem>> {
    return this.getPaginatedResult({}, options);
  }

  async search(
    filters: {
      q?: string;
      classRoom?: string;
      filiere?: string; // pas encore persisté dans l'entité actuelle
      specialStatus?: string;
    },
    options?: PaginationOptions,
  ): Promise<PaginatedResult<StudentListItem>> {
    const { page, limit } = this.normalizePagination(options);

    const query = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class')
      .orderBy('student.lastName', 'ASC')
      .addOrderBy('student.firstName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.q && filters.q.trim() !== '') {
      const term = `%${filters.q.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(student.firstName) LIKE :term OR LOWER(student.lastName) LIKE :term OR LOWER(student.matricule) LIKE :term)',
        { term },
      );
    }

    if (filters?.classRoom && filters.classRoom.trim() !== '') {
      query.andWhere('class.name = :classRoom', { classRoom: filters.classRoom.trim() });
    }

    if (filters?.specialStatus && filters.specialStatus.trim() !== '') {
      query.andWhere('student.specialStatus = :specialStatus', { specialStatus: filters.specialStatus.trim() });
    }

    // NOTE: filiere est envoyée par le front mais pas stockée dans l'entité actuelle.
    // On n'applique pas de filtre DB ici pour éviter des erreurs silencieuses.

    const [items, total] = await query.getManyAndCount();
    const lastPage = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      items: items.map((s) => this.toListItem(s)),
      total,
      lastPage,
    };
  }

  async findOne(id: string): Promise<StudentListItem> {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid ID format');
    }
    const student = await this.studentRepository.findOne({
      where: { id: numericId },
      relations: { class: true },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return this.toListItem(student);
  }

  async update(id: string, updateStudentDto: any): Promise<StudentListItem> {
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
      photo: (updateStudentDto as any).photo,
      class: classEntity ?? undefined,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    const savedStudent = await this.studentRepository.save(student) as Student;
    this.client.emit('student.updated', savedStudent);
    const withClass = await this.studentRepository.findOne({
      where: { id: savedStudent.id },
      relations: { class: true },
    });
    return this.toListItem(withClass || savedStudent);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException(`Invalid student id: ${id}`);
    }
    const studentEntity = await this.studentRepository.findOne({ where: { id: numericId } });
    if (!studentEntity) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    await this.studentRepository.remove(studentEntity);
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

      const savedStudent = await this.studentRepository.save(student) as Student;
      this.client.emit('student.created', savedStudent);
      count++;
    }

    return { imported: count };
  }
}
