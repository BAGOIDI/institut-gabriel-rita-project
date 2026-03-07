import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

const DAYS_MAP: Record<string, number> = {
  'Lundi': 1, 'Mardi': 2, 'Mercredi': 3,
  'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6, 'Dimanche': 7,
};

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {}

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    // Convertir 'day' (string) en dayOfWeek (number) si nécessaire
    const payload: any = { ...dto };
    if ((dto as any).day && !dto.dayOfWeek) {
      payload.dayOfWeek = DAYS_MAP[(dto as any).day] ?? 1;
      payload.className = (dto as any).class || dto.className;
      payload.subjectName = (dto as any).subject || dto.subjectName;
      payload.teacherName = (dto as any).teacher || dto.teacherName;
    }
    const schedule = this.scheduleRepository.create(payload);
    return this.scheduleRepository.save(schedule) as unknown as Promise<Schedule>;
  }

  async findAll(): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByClass(className: string): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { className, isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByTeacher(teacherName: string): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { teacherName: ILike(`%${teacherName}%`), isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByRoom(room: string): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { room: ILike(`%${room}%`), isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findById(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Créneau introuvable (id: ${id})`);
    }
    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    const payload: any = { ...dto };
    if ((dto as any).day && !dto.dayOfWeek) {
      payload.dayOfWeek = DAYS_MAP[(dto as any).day] ?? 1;
      if ((dto as any).class) payload.className = (dto as any).class;
      if ((dto as any).subject) payload.subjectName = (dto as any).subject;
      if ((dto as any).teacher) payload.teacherName = (dto as any).teacher;
    }
    const schedule = await this.scheduleRepository.preload({ id, ...payload });
    if (!schedule) {
      throw new NotFoundException(`Créneau introuvable (id: ${id})`);
    }
    return await this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findById(id);
    schedule.isActive = false;
    await this.scheduleRepository.save(schedule);
  }
}
