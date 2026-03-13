import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialty } from '../../entities/specialty.entity';
import { CreateSpecialtyDto } from './dto/create-specialtys.dto';
import { UpdateSpecialtyDto } from './dto/update-specialtys.dto';

@Injectable()
export class SpecialtyService {
  constructor(
    @InjectRepository(Specialty)
    private specialtyRepository: Repository<Specialty>,
  ) {}

  async create(createSpecialtyDto: CreateSpecialtyDto): Promise<Specialty> {
    const specialty = this.specialtyRepository.create(createSpecialtyDto);
    return await this.specialtyRepository.save(specialty);
  }

  async findAll(): Promise<Specialty[]> {
    return await this.specialtyRepository.find();
  }

  async findOne(id: string): Promise<Specialty> {
    const numericId = Number(id);
    const specialty = await this.specialtyRepository.findOne({ where: { id: numericId } });
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    return specialty;
  }

  async update(id: string, updateSpecialtyDto: UpdateSpecialtyDto): Promise<Specialty> {
    const numericId = Number(id);
    const specialty = await this.specialtyRepository.preload({
      id: numericId,
      ...updateSpecialtyDto,
    });
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    return await this.specialtyRepository.save(specialty);
  }

  async remove(id: string): Promise<void> {
    const specialty = await this.findOne(id);
    await this.specialtyRepository.remove(specialty);
  }
}
