import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemOption } from './system-option.entity';
import { CreateSystemOptionDto } from './dto/create-system-option.dto';

@Injectable()
export class SystemOptionsService implements OnModuleInit {

  private readonly logger = new Logger(SystemOptionsService.name);

  async onModuleInit() {
    await this.seedDefaultOptions();
  }

  private async seedDefaultOptions() {
    const count = await this.repo.count();
    if (count === 0) {
      this.logger.log('Initialisation des options système par défaut...');
      const defaultOptions = [
        { category: 'GENDER', value: 'M', label: 'Masculin', isActive: true },
        { category: 'GENDER', value: 'F', label: 'Féminin', isActive: true },
        { category: 'MARITAL_STATUS', value: 'SINGLE', label: 'Célibataire', isActive: true },
        { category: 'MARITAL_STATUS', value: 'MARRIED', label: 'Marié(e)', isActive: true },
        { category: 'MARITAL_STATUS', value: 'DIVORCED', label: 'Divorcé(e)', isActive: true },
        { category: 'MARITAL_STATUS', value: 'WIDOWED', label: 'Veuf/Veuve', isActive: true },
        { category: 'DEGREE', value: 'BAC', label: 'Baccalauréat', isActive: true },
        { category: 'DEGREE', value: 'LICENCE', label: 'Licence', isActive: true },
        { category: 'DEGREE', value: 'MASTER', label: 'Master', isActive: true },
        { category: 'SPECIALTY', value: 'INFO', label: 'Informatique', isActive: true },
        { category: 'SPECIALTY', value: 'GESTION', label: 'Gestion', isActive: true },
        { category: 'CLASS_ROOM', value: 'L1-INFO', label: 'Licence 1 Informatique', isActive: true },
        { category: 'CLASS_ROOM', value: 'L2-INFO', label: 'Licence 2 Informatique', isActive: true },
      ];
      await this.repo.save(defaultOptions);
      this.logger.log('Options système par défaut créées avec succès.');
    }
  }

  constructor(
    @InjectRepository(SystemOption)
    private repo: Repository<SystemOption>,
  ) {}

  async create(dto: CreateSystemOptionDto) {
    const option = this.repo.create(dto);
    return await this.repo.save(option);
  }

  async findAll() {
    return await this.repo.find({ order: { category: 'ASC', label: 'ASC' } });
  }

  async findByCategory(category: string) {
    return await this.repo.find({ where: { category, isActive: true }, order: { label: 'ASC' } });
  }

  async update(id: string, dto: Partial<CreateSystemOptionDto>) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
