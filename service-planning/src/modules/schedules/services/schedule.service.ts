import { BadRequestException, Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { CreateSchedulePayload } from '../payloads/create-schedule.payload';
import { UpdateSchedulePayload } from '../payloads/update-schedule.payload';
import { ScheduleConflictException } from '../exceptions/schedule.exceptions';
import { ScheduleUtility } from '../utilities/schedule.utility';

@Injectable()
export class ScheduleService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(private readonly repo: ScheduleRepository) {}

  private normalizeAndValidateOrThrow(input: { dayOfWeek: number; startTime: string; endTime: string }) {
    const dayOfWeek = Number(input.dayOfWeek);
    const startTime = ScheduleUtility.formatTime(input.startTime);
    const endTime = ScheduleUtility.formatTime(input.endTime);

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6) {
      throw new BadRequestException('Jour invalide (1=Lundi ... 6=Samedi).');
    }
    if (!ScheduleUtility.isValidTimeHHmm(startTime) || !ScheduleUtility.isValidTimeHHmm(endTime)) {
      throw new BadRequestException('Heure invalide. Format attendu: HH:mm.');
    }
    if (ScheduleUtility.timeToMinutes(endTime) <= ScheduleUtility.timeToMinutes(startTime)) {
      throw new BadRequestException('Heure de fin doit être après l’heure de début.');
    }
    if (!ScheduleUtility.isAllowedClassSlot(startTime, endTime)) {
      throw new BadRequestException(
        `Créneau horaire non autorisé (${startTime} - ${endTime}). Utilisez un créneau officiel (cours) et évitez les pauses.`,
      );
    }
    return { dayOfWeek, startTime, endTime };
  }

  private async assertNoConflictsOrThrow(args: {
    scheduleIdToExclude?: number;
    staffId: number;
    classId: number;
    roomName?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) {
    const excludeId = args.scheduleIdToExclude;

    // 1. Teacher conflict
    const teacherSchedules = await this.repo.findByStaffAndDay(args.staffId, args.dayOfWeek);
    for (const sched of teacherSchedules) {
      if (excludeId && sched.id === excludeId) continue;
      if (ScheduleUtility.isOverlapping(args.startTime, args.endTime, sched.startTime, sched.endTime)) {
        throw new ScheduleConflictException('Conflit: enseignant déjà occupé sur ce créneau.');
      }
    }

    // 2. Class conflict
    const classSchedules = await this.repo.findByClassAndDay(args.classId, args.dayOfWeek);
    for (const sched of classSchedules) {
      if (excludeId && sched.id === excludeId) continue;
      if (ScheduleUtility.isOverlapping(args.startTime, args.endTime, sched.startTime, sched.endTime)) {
        throw new ScheduleConflictException('Conflit: classe déjà occupée sur ce créneau.');
      }
    }

    // 3. Room conflict
    const roomName = args.roomName?.trim();
    if (roomName && roomName !== 'TBD') {
      const roomSchedules = await this.repo.findByRoomAndDay(roomName, args.dayOfWeek);
      for (const sched of roomSchedules) {
        if (excludeId && sched.id === excludeId) continue;
        if (ScheduleUtility.isOverlapping(args.startTime, args.endTime, sched.startTime, sched.endTime)) {
          throw new ScheduleConflictException('Conflit: salle déjà occupée sur ce créneau.');
        }
      }
    }
  }

  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;
    try {
      const demoSlots = [
        // Lundi (1)
        { classId: 1, staffId: 1, subjectId: 1, dayOfWeek: 1, startTime: '08:00', endTime: '09:50', roomName: 'Salle 101' },
        { classId: 1, staffId: 2, subjectId: 2, dayOfWeek: 1, startTime: '10:05', endTime: '12:00', roomName: 'Salle 101' },
        { classId: 1, staffId: 3, subjectId: 3, dayOfWeek: 1, startTime: '13:00', endTime: '14:50', roomName: 'Salle 101' },
        { classId: 1, staffId: 1, subjectId: 1, dayOfWeek: 1, startTime: '15:05', endTime: '17:00', roomName: 'Salle 101' },
        // Mardi (2)
        { classId: 2, staffId: 2, subjectId: 4, dayOfWeek: 2, startTime: '08:00', endTime: '09:50', roomName: 'Salle 102' },
        { classId: 2, staffId: 3, subjectId: 5, dayOfWeek: 2, startTime: '10:05', endTime: '12:00', roomName: 'Salle 102' },
        { classId: 2, staffId: 1, subjectId: 6, dayOfWeek: 2, startTime: '13:00', endTime: '14:50', roomName: 'Salle 102' },
        { classId: 2, staffId: 2, subjectId: 7, dayOfWeek: 2, startTime: '15:05', endTime: '17:00', roomName: 'Gymnase' },
        // Soir (Mercredi 3, classe 1)
        { classId: 1, staffId: 1, subjectId: 8, dayOfWeek: 3, startTime: '17:30', endTime: '19:20', roomName: 'Salle 101' },
        { classId: 1, staffId: 3, subjectId: 9, dayOfWeek: 3, startTime: '19:35', endTime: '21:00', roomName: 'Salle Info' },
      ];
      const entities = this.repo.create(demoSlots as any[]);
      await this.repo.save(entities as any);
      this.logger.log(`Création de ${entities.length} créneaux de test (service-planning).`);
    } catch (e) {
      this.logger.warn(`Impossible de créer les créneaux de test: ${e?.message || e}`);
    }
  }

  async create(payload: CreateSchedulePayload) {
    const roomName = (payload as any).roomName as string | undefined;
    const normalized = this.normalizeAndValidateOrThrow({
      dayOfWeek: payload.dayOfWeek,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
    await this.assertNoConflictsOrThrow({
      staffId: payload.staffId,
      classId: payload.classId,
      roomName,
      dayOfWeek: normalized.dayOfWeek,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
    });

    const schedule = this.repo.create({
      staffId: payload.staffId,
      subjectId: payload.subjectId,
      classId: payload.classId,
      dayOfWeek: normalized.dayOfWeek,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
      roomName: roomName?.trim() || 'TBD',
      academicYearId: (payload as any).academicYearId
    });
    return await this.repo.save(schedule);
  }

  async findAll(filters: { classId?: string; roomId?: string; staffId?: string }) {
    const where: any = {};
    if (filters.classId) {
      where.classId = filters.classId;
    }
    if (filters.roomId) {
      where.roomName = filters.roomId;
    }
    if (filters.staffId) {
      where.staffId = filters.staffId;
    }
    return await this.repo.find({ where });
  }

  async findOne(id: number) {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException(`Schedule with ID ${id} not found`);
    return schedule;
  }

  async findByClass(classId: number) {
    return await this.repo.find({ where: { classId } });
  }

  async findByStaff(staffId: number) {
    return await this.repo.find({ where: { staffId } });
  }

  async update(id: number, payload: UpdateSchedulePayload) {
    const schedule = await this.findOne(id);

    const next = {
      staffId: payload.staffId ?? schedule.staffId,
      classId: payload.classId ?? schedule.classId,
      subjectId: payload.subjectId ?? schedule.subjectId,
      roomName: (payload.roomName ?? schedule.roomName) as string | undefined,
      dayOfWeek: payload.dayOfWeek ?? schedule.dayOfWeek,
      startTime: payload.startTime ?? schedule.startTime,
      endTime: payload.endTime ?? schedule.endTime,
      academicYearId: payload.academicYearId ?? (schedule as any).academicYearId,
    };

    const normalized = this.normalizeAndValidateOrThrow({
      dayOfWeek: next.dayOfWeek,
      startTime: next.startTime,
      endTime: next.endTime,
    });

    await this.assertNoConflictsOrThrow({
      scheduleIdToExclude: id,
      staffId: Number(next.staffId),
      classId: Number(next.classId),
      roomName: next.roomName,
      dayOfWeek: normalized.dayOfWeek,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
    });

    Object.assign(schedule, {
      staffId: Number(next.staffId),
      classId: Number(next.classId),
      subjectId: Number(next.subjectId),
      roomName: next.roomName?.trim() || 'TBD',
      dayOfWeek: normalized.dayOfWeek,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
      academicYearId: next.academicYearId,
    });

    return await this.repo.save(schedule);
  }

  async remove(id: number) {
    const schedule = await this.findOne(id);
    await this.repo.remove(schedule);
    return { deleted: true };
  }
}
