import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bulletin } from './entities/bulletin.entity';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';

@Injectable()
export class BulletinService {
  constructor(
    @InjectRepository(Bulletin)
    private bulletinRepository: Repository<Bulletin>,
  ) {}

  async create(createBulletinDto: CreateBulletinDto): Promise<Bulletin> {
    const bulletin = this.bulletinRepository.create(createBulletinDto);
    return await this.bulletinRepository.save(bulletin);
  }

  async findAll(): Promise<Bulletin[]> {
    return await this.bulletinRepository.find();
  }

  async findOne(id: string): Promise<Bulletin> {
    const bulletin = await this.bulletinRepository.findOne({ where: { id } });
    if (!bulletin) {
      throw new NotFoundException(`Bulletin with ID ${id} not found`);
    }
    return bulletin;
  }

  async update(id: string, updateBulletinDto: UpdateBulletinDto): Promise<Bulletin> {
    const bulletin = await this.bulletinRepository.preload({
      id: id,
      ...updateBulletinDto,
    });
    if (!bulletin) {
      throw new NotFoundException(`Bulletin with ID ${id} not found`);
    }
    return await this.bulletinRepository.save(bulletin);
  }

  async remove(id: string): Promise<void> {
    const bulletin = await this.findOne(id);
    await this.bulletinRepository.remove(bulletin);
  }
}
