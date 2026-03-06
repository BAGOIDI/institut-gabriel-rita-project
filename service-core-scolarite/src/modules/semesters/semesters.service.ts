import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Semester } from '../../entities/semester.entity';
import { CreateSemesterDto } from './dto/create-semesters.dto';
import { UpdateSemesterDto } from './dto/update-semesters.dto';

@Injectable()
export class SemesterService {
  constructor(
    @InjectRepository(Semester)
    private semesterRepository: Repository<Semester>,
  ) {}

  async create(createSemesterDto: CreateSemesterDto): Promise<Semester> {
    const semester = this.semesterRepository.create(createSemesterDto);
    return await this.semesterRepository.save(semester);
  }

  async findAll(): Promise<Semester[]> {
    return await this.semesterRepository.find();
  }

  async findOne(id: string): Promise<Semester> {
    const semester = await this.semesterRepository.findOne({ where: { id } });
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return semester;
  }

  async update(id: string, updateSemesterDto: UpdateSemesterDto): Promise<Semester> {
    const semester = await this.semesterRepository.preload({
      id: id,
      ...updateSemesterDto,
    });
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }
    return await this.semesterRepository.save(semester);
  }

  async remove(id: string): Promise<void> {
    const semester = await this.findOne(id);
    await this.semesterRepository.remove(semester);
  }
}
