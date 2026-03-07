import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from '../../entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async findAll(opts: { date: Date; status?: string; page: number; limit: number }) {
    const { date, status, page, limit } = opts;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const qb = this.attendanceRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.teacher', 'teacher')
      .where('a.date BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });

    if (status && status !== 'ALL') {
      qb.andWhere('a.status = :status', { status });
    }

    const [items, total] = await qb
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, lastPage: Math.ceil(total / limit) };
  }

  async getStats(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.attendanceRepository.find({
      where: { date: Between(startOfDay, endOfDay) } as any,
    });

    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const total = records.length;

    return {
      totalTeachers: total,
      present,
      absent,
      late,
      onTime: present,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
    };
  }

  async getHistory(opts: { staffId?: string; month?: string; year?: string }) {
    const qb = this.attendanceRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.teacher', 'teacher');

    if (opts.staffId) {
      qb.where('a.staffId = :staffId', { staffId: opts.staffId });
    }
    if (opts.year) {
      qb.andWhere('EXTRACT(YEAR FROM a.date) = :year', { year: parseInt(opts.year) });
    }
    if (opts.month) {
      qb.andWhere('EXTRACT(MONTH FROM a.date) = :month', { month: parseInt(opts.month) + 1 });
    }

    return qb.orderBy('a.date', 'DESC').getMany();
  }

  async create(data: {
    staffId: string;
    checkIn?: string;
    checkOut?: string;
    status?: 'PRESENT' | 'ABSENT' | 'LATE';
    lateMinutes?: number;
    date?: string;
  }): Promise<Attendance> {
    const attendance = this.attendanceRepository.create({
      staffId: data.staffId,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      status: data.status || 'PRESENT',
      lateMinutes: data.lateMinutes || 0,
      isLate: (data.lateMinutes || 0) > 0 || data.status === 'LATE',
      date: data.date ? new Date(data.date) : new Date(),
    });
    return this.attendanceRepository.save(attendance);
  }

  async update(id: string, data: Partial<Attendance>): Promise<Attendance> {
    const record = await this.attendanceRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Présence ${id} introuvable`);
    Object.assign(record, data);
    return this.attendanceRepository.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.attendanceRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Présence ${id} introuvable`);
    await this.attendanceRepository.remove(record);
    return { message: `Présence ${id} supprimée` };
  }
}
