import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../entities/class.entity';
import { CreateClassDto } from './dto/create-classes.dto';
import { UpdateClassDto } from './dto/update-classes.dto';

@Injectable()
export class ClassService implements OnModuleInit {
  private readonly logger = new Logger(ClassService.name);
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.classRepository.count();
      if (count > 0) return;
      const demo = [
        { name: '6ème A', tuitionFee: 0 } as any,
        { name: '5ème A', tuitionFee: 0 } as any,
        { name: '4ème A', tuitionFee: 0 } as any,
        { name: '3ème A', tuitionFee: 0 } as any,
        { name: '2nde A', tuitionFee: 0 } as any,
        { name: '1ère A', tuitionFee: 0 } as any,
        { name: 'Tle A', tuitionFee: 0 } as any,
      ];
      const entities = this.classRepository.create(demo);
      await this.classRepository.save(entities);
      this.logger.log(`Création de ${entities.length} classes de test.`);
    } catch (e) {
      this.logger.warn(`Impossible de créer des classes de test: ${e?.message || e}`);
    }
  }

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

  async findSubjectsByClass(id: string): Promise<any[]> {
    const foundClass = await this.classRepository.findOne({ where: { id }, relations: ['subjects'] });
    if (!foundClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return foundClass.subjects;
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
