import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../../entities/academic-year.entity';
import { CreateAcademicYearDto } from './dto/create-academic-years.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-years.dto';

@Injectable()
export class AcademicYearService {
  constructor(
    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,
  ) {}

  async create(createAcademicYearDto: CreateAcademicYearDto): Promise<AcademicYear> {
    const academicYear = this.academicYearRepository.create(createAcademicYearDto);
    return await this.academicYearRepository.save(academicYear);
  }

  async findAll(): Promise<AcademicYear[]> {
    return await this.academicYearRepository.find();
  }

  async findOne(id: string): Promise<AcademicYear> {
    const academicYear = await this.academicYearRepository.findOne({ where: { id } });
    if (!academicYear) {
      throw new NotFoundException(`AcademicYear with ID ${id} not found`);
    }
    return academicYear;
  }

  async update(id: string, updateAcademicYearDto: UpdateAcademicYearDto): Promise<AcademicYear> {
    const academicYear = await this.academicYearRepository.preload({
      id: id,
      ...updateAcademicYearDto,
    });
    if (!academicYear) {
      throw new NotFoundException(`AcademicYear with ID ${id} not found`);
    }
    return await this.academicYearRepository.save(academicYear);
  }

  async remove(id: string): Promise<void> {
    const academicYear = await this.findOne(id);
    await this.academicYearRepository.remove(academicYear);
  }
}
