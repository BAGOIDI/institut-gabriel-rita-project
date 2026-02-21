import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campus } from './campus.entity';
import { CreateCampusDto, UpdateCampusDto } from './campus.dto';

@Injectable()
export class CampusService {
  constructor(
    @InjectRepository(Campus)
    private campusRepository: Repository<Campus>,
  ) {}

  async findAll(): Promise<Campus[]> {
    return await this.campusRepository.find();
  }

  async findOne(id: string): Promise<Campus> {
    const campus = await this.campusRepository.findOne({
      where: { id },
      relations: ['users', 'classes'],
    });
    
    if (!campus) {
      throw new NotFoundException(`Campus with ID ${id} not found`);
    }
    
    return campus;
  }

  async create(createCampusDto: CreateCampusDto): Promise<Campus> {
    const campus = new Campus();
    Object.assign(campus, createCampusDto);
    
    return await this.campusRepository.save(campus);
  }

  async update(id: string, updateCampusDto: UpdateCampusDto): Promise<Campus> {
    const campus = await this.campusRepository.preload({
      id,
      ...updateCampusDto,
    });
    
    if (!campus) {
      throw new NotFoundException(`Campus with ID ${id} not found`);
    }
    
    return await this.campusRepository.save(campus);
  }

  async remove(id: string): Promise<void> {
    const campus = await this.findOne(id);
    await this.campusRepository.remove(campus);
  }
}