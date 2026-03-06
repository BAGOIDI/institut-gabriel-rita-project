import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../entities/class.entity';
import { CreateClassDto } from './dto/create-classes.dto';
import { UpdateClassDto } from './dto/update-classes.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(createClassDto: CreateClassDto): Promise<Class> {
    const newClass = this.classRepository.create(createClassDto);
    return await this.classRepository.save(newClass);
  }

  async findAll(): Promise<Class[]> {
    return await this.classRepository.find();
  }

  async findOne(id: string): Promise<Class> {
    const foundClass = await this.classRepository.findOne({ where: { id } });
    if (!foundClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return foundClass;
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const existingClass = await this.classRepository.preload({
      id: id,
      ...updateClassDto,
    });
    if (!existingClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return await this.classRepository.save(existingClass);
  }

  async remove(id: string): Promise<void> {
    const classToRemove = await this.findOne(id);
    await this.classRepository.remove(classToRemove);
  }
}
