import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../../entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class StaffService implements OnModuleInit {
  private readonly logger = new Logger(StaffService.name);
  private rabbitClient: ClientProxy;
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  private normalizeEmergencyContact(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    const name = value?.name ? String(value.name) : '';
    const phone = value?.phone ? String(value.phone) : '';
    const relationship = value?.relationship ? String(value.relationship) : '';
    return [name, phone, relationship].filter(Boolean).join(' | ') || null;
  }

  private normalizePayload(dto: CreateStaffDto | UpdateStaffDto): Partial<Staff> {
    return {
      userId: dto.userId ?? undefined,
      matricule: dto.matricule ?? undefined,
      firstName: dto.firstName ?? undefined,
      lastName: dto.lastName ?? undefined,
      gender: dto.gender ?? undefined,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      placeOfBirth: dto.placeOfBirth ?? undefined,
      nationality: dto.nationality ?? undefined,
      maritalStatus: dto.maritalStatus ?? undefined,
      idCardNumber: dto.idCardNumber ?? undefined,
      phoneNumber: dto.phoneNumber ?? undefined,
      email: dto.email ?? undefined,
      address: dto.address ?? undefined,
      emergencyContact: this.normalizeEmergencyContact((dto as any).emergencyContact),
      specialty: dto.specialty ?? undefined,
      diploma: dto.diploma ?? undefined,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      contractType: dto.contractType ?? undefined,
      status: dto.status ?? undefined,
      photo: dto.photo ?? undefined,
      socialSecurityNumber: dto.socialSecurityNumber ?? undefined,
      bankAccount: dto.bankAccount ?? undefined,
      hourlyRate: dto.hourlyRate ?? undefined,
      biometricId: dto.biometricId ?? undefined,
    };
  }

  private generateMatricule(): string {
    return `ENS-${Date.now()}`;
  }

  async create(createStaffDto: CreateStaffDto): Promise<Staff> {
    const payload = this.normalizePayload(createStaffDto);
    if (!payload.matricule) payload.matricule = this.generateMatricule();
    const staff = this.staffRepository.create(payload);
    const saved = await this.staffRepository.save(staff);

    // Envoi d'un événement pour l'indexation Typesense des enseignants
    try {
      this.rabbitClient.emit('teacher.created', {
        id: saved.id,
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        phoneNumber: saved.phoneNumber,
        specialty: saved.specialty,
        contractType: saved.contractType,
        status: saved.status,
      });
      this.logger.log(`🐰 Event 'teacher.created' sent for ${saved.email || saved.phoneNumber}`);
    } catch (e) {
      this.logger.warn(`Impossible d'émettre l'événement teacher.created: ${e?.message || e}`);
    }

    return saved;
  }

  async findAll(query?: {
    q?: string;
    status?: string;
    specialty?: string;
    contractType?: string;
    classId?: number;
    subjectId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ items: Staff[]; total: number; lastPage: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 10));

    const qb = this.staffRepository.createQueryBuilder('staff');

    if (query?.classId) {
      qb.innerJoin('staff.subjects', 'subject')
        .andWhere('subject.class_id = :classId', { classId: query.classId });
    }

    if (query?.subjectId) {
      qb.innerJoin('staff.subjects', 'subject_filter')
        .andWhere('subject_filter.id = :subjectId', { subjectId: query.subjectId });
    }

    if (query?.q) {
      const q = `%${query.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(staff.firstName) LIKE :q OR LOWER(staff.lastName) LIKE :q OR LOWER(staff.email) LIKE :q OR LOWER(staff.matricule) LIKE :q)',
        { q },
      );
    }
    if (query?.status) {
      qb.andWhere('staff.status = :status', { status: query.status });
    }
    if (query?.specialty) {
      qb.andWhere('staff.specialty = :specialty', { specialty: query.specialty });
    }
    if (query?.contractType) {
      qb.andWhere('staff.contractType = :contractType', { contractType: query.contractType });
    }

    qb.orderBy('staff.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const lastPage = Math.max(1, Math.ceil(total / limit));
    return { items, total, lastPage, page, limit };
  }

  async findOne(id: number): Promise<Staff> {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
    return staff;
  }

  async update(id: number, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.staffRepository.preload({
      id,
      ...this.normalizePayload(updateStaffDto),
    });
    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
    const saved = await this.staffRepository.save(staff);

    // Mise à jour de l'enseignant dans Typesense
    try {
      this.rabbitClient.emit('teacher.updated', {
        id: saved.id,
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        phoneNumber: saved.phoneNumber,
        specialty: saved.specialty,
        contractType: saved.contractType,
        status: saved.status,
      });
      this.logger.log(`🐰 Event 'teacher.updated' sent for ${saved.email || saved.phoneNumber}`);
    } catch (e) {
      this.logger.warn(`Impossible d'émettre l'événement teacher.updated: ${e?.message || e}`);
    }

    return saved;
  }

  async remove(id: number): Promise<void> {
    const staff = await this.findOne(id);
    await this.staffRepository.remove(staff);

    // Suppression de l'enseignant dans Typesense
    try {
      this.rabbitClient.emit('teacher.deleted', { id });
      this.logger.log(`🐰 Event 'teacher.deleted' sent for ID ${id}`);
    } catch (e) {
      this.logger.warn(`Impossible d'émettre l'événement teacher.deleted: ${e?.message || e}`);
    }
  }

  async importMany(rows: CreateStaffDto[]): Promise<{ created: number }> {
    const items = rows.map((row) => {
      const payload = this.normalizePayload(row);
      if (!payload.matricule) payload.matricule = this.generateMatricule();
      return payload;
    });
    const entities = this.staffRepository.create(items);
    await this.staffRepository.save(entities);
    // Indexation en masse dans Typesense via événements
    try {
      for (const e of entities) {
        this.rabbitClient.emit('teacher.created', {
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phoneNumber: e.phoneNumber,
          specialty: e.specialty,
          contractType: e.contractType,
          status: e.status,
        });
      }
      this.logger.log(`🐰 Events 'teacher.created' sent for ${entities.length} enseignants`);
    } catch (e) {
      this.logger.warn(`Impossible d'émettre les événements teacher.created: ${e?.message || e}`);
    }

    return { created: entities.length };
  }

  async onModuleInit() {
    // Initialisation du client RabbitMQ pour les événements enseignants
    this.rabbitClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
        queue: 'school_events',
        queueOptions: { durable: false },
      },
    });

    try {
      const count = await this.staffRepository.count();
      if (count > 0) return;
      const demo: CreateStaffDto[] = [
        { firstName: 'Alice', lastName: 'Dupont', phoneNumber: '670000001', specialty: 'Mathématiques', status: 'Permanent', contractType: 'CDI', email: 'alice@igr.local' } as any,
        { firstName: 'Bruno', lastName: 'Ngono', phoneNumber: '670000002', specialty: 'Français', status: 'Permanent', contractType: 'CDI', email: 'bruno@igr.local' } as any,
        { firstName: 'Claire', lastName: 'Manga', phoneNumber: '670000003', specialty: 'Physique-Chimie', status: 'Vacataire', contractType: 'CDD', email: 'claire@igr.local' } as any,
      ];
      await this.importMany(demo);
      this.logger.log(`Création de ${demo.length} enseignants de test.`);
    } catch (e) {
      this.logger.warn(`Impossible de créer les enseignants de test: ${e?.message || e}`);
    }
  }
}
