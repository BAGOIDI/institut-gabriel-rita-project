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
    await this.ensureTimetableSlots();
  }

  private async seedDefaultOptions() {
    const count = await this.repo.count();
    if (count === 0) {
      this.logger.log('Initialisation des options système par défaut...');
      const defaultOptions = [
        { category: 'GENDER', value: 'M', labelFr: 'Masculin', labelEn: 'Male', label: 'Masculin', isActive: true },
        { category: 'GENDER', value: 'F', labelFr: 'Féminin', labelEn: 'Female', label: 'Féminin', isActive: true },
        { category: 'MARITAL_STATUS', value: 'Célibataire', labelFr: 'Célibataire', labelEn: 'Single', label: 'Célibataire', isActive: true },
        { category: 'MARITAL_STATUS', value: 'Marié(e)', labelFr: 'Marié(e)', labelEn: 'Married', label: 'Marié(e)', isActive: true },
        { category: 'MARITAL_STATUS', value: 'Divorcé(e)', labelFr: 'Divorcé(e)', labelEn: 'Divorced', label: 'Divorcé(e)', isActive: true },
        { category: 'MARITAL_STATUS', value: 'Veuf(ve)', labelFr: 'Veuf(ve)', labelEn: 'Widowed', label: 'Veuf(ve)', isActive: true },
        { category: 'DEGREE', value: 'BAC', labelFr: 'Baccalauréat', labelEn: 'Baccalaureate', label: 'Baccalauréat', isActive: true },
        { category: 'DEGREE', value: 'Licence', labelFr: 'Licence', labelEn: 'Bachelor', label: 'Licence', isActive: true },
        { category: 'DEGREE', value: 'Master', labelFr: 'Master', labelEn: 'Master', label: 'Master', isActive: true },
        { category: 'DEGREE', value: 'Doctorat', labelFr: 'Doctorat', labelEn: 'PhD', label: 'Doctorat', isActive: true },
        { category: 'DEGREE', value: 'CAPES', labelFr: 'CAPES', labelEn: 'CAPES', label: 'CAPES', isActive: true },
        { category: 'DEGREE', value: 'CAFOP', labelFr: 'CAFOP', labelEn: 'CAFOP', label: 'CAFOP', isActive: true },
        { category: 'SPECIALTY', value: 'Mathématiques', labelFr: 'Mathématiques', labelEn: 'Mathematics', label: 'Mathématiques', isActive: true },
        { category: 'SPECIALTY', value: 'Physique-Chimie', labelFr: 'Physique-Chimie', labelEn: 'Physics & Chemistry', label: 'Physique-Chimie', isActive: true },
        { category: 'SPECIALTY', value: 'Français', labelFr: 'Français', labelEn: 'French', label: 'Français', isActive: true },
        { category: 'SPECIALTY', value: 'Anglais', labelFr: 'Anglais', labelEn: 'English', label: 'Anglais', isActive: true },
        { category: 'SPECIALTY', value: 'SVT', labelFr: 'SVT', labelEn: 'Biology', label: 'SVT', isActive: true },
        { category: 'SPECIALTY', value: 'Histoire-Géo', labelFr: 'Histoire-Géo', labelEn: 'History & Geography', label: 'Histoire-Géo', isActive: true },
        { category: 'SPECIALTY', value: 'EPS', labelFr: 'EPS', labelEn: 'Physical Education', label: 'EPS', isActive: true },
        { category: 'SPECIALTY', value: 'Philosophie', labelFr: 'Philosophie', labelEn: 'Philosophy', label: 'Philosophie', isActive: true },
        { category: 'SPECIALTY', value: 'Informatique', labelFr: 'Informatique', labelEn: 'Computer Science', label: 'Informatique', isActive: true },
        { category: 'TEACHER_STATUS', value: 'Permanent', labelFr: 'Permanent', labelEn: 'Permanent', label: 'Permanent', isActive: true },
        { category: 'TEACHER_STATUS', value: 'Vacataire', labelFr: 'Vacataire', labelEn: 'Part-time', label: 'Vacataire', isActive: true },
        { category: 'TEACHER_STATUS', value: 'Contractuel', labelFr: 'Contractuel', labelEn: 'Contract', label: 'Contractuel', isActive: true },
        { category: 'TEACHER_STATUS', value: 'Stagiaire', labelFr: 'Stagiaire', labelEn: 'Trainee', label: 'Stagiaire', isActive: true },
        { category: 'CONTRACT_TYPE', value: 'CDI', labelFr: 'CDI', labelEn: 'Permanent contract', label: 'CDI', isActive: true },
        { category: 'CONTRACT_TYPE', value: 'CDD', labelFr: 'CDD', labelEn: 'Fixed-term contract', label: 'CDD', isActive: true },
        { category: 'CONTRACT_TYPE', value: 'Vacation', labelFr: 'Vacation', labelEn: 'Temporary', label: 'Vacation', isActive: true },
        // Timetable Options
        { category: 'TIMETABLE_DAY', value: 'Lundi', labelFr: 'Lundi', labelEn: 'Monday', label: 'Lundi', isActive: true },
        { category: 'TIMETABLE_DAY', value: 'Mardi', labelFr: 'Mardi', labelEn: 'Tuesday', label: 'Mardi', isActive: true },
        { category: 'TIMETABLE_DAY', value: 'Mercredi', labelFr: 'Mercredi', labelEn: 'Wednesday', label: 'Mercredi', isActive: true },
        { category: 'TIMETABLE_DAY', value: 'Jeudi', labelFr: 'Jeudi', labelEn: 'Thursday', label: 'Jeudi', isActive: true },
        { category: 'TIMETABLE_DAY', value: 'Vendredi', labelFr: 'Vendredi', labelEn: 'Friday', label: 'Vendredi', isActive: true },
        { category: 'TIMETABLE_DAY', value: 'Samedi', labelFr: 'Samedi', labelEn: 'Saturday', label: 'Samedi', isActive: true },
        { category: 'TIMETABLE_DAY', value: 'Dimanche', labelFr: 'Dimanche', labelEn: 'Sunday', label: 'Dimanche', isActive: true },
        
        { category: 'TIMETABLE_ROOM', value: 'Salle 101', labelFr: 'Salle 101', labelEn: 'Room 101', label: 'Salle 101', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Salle 102', labelFr: 'Salle 102', labelEn: 'Room 102', label: 'Salle 102', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Salle 103', labelFr: 'Salle 103', labelEn: 'Room 103', label: 'Salle 103', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Salle 201', labelFr: 'Salle 201', labelEn: 'Room 201', label: 'Salle 201', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Salle 202', labelFr: 'Salle 202', labelEn: 'Room 202', label: 'Salle 202', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Labo Physique', labelFr: 'Labo Physique', labelEn: 'Physics Lab', label: 'Labo Physique', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Labo Chimie', labelFr: 'Labo Chimie', labelEn: 'Chemistry Lab', label: 'Labo Chimie', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Labo SVT', labelFr: 'Labo SVT', labelEn: 'SVT Lab', label: 'Labo SVT', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Salle Info', labelFr: 'Salle Info', labelEn: 'Computer Room', label: 'Salle Info', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Gymnase', labelFr: 'Gymnase', labelEn: 'Gym', label: 'Gymnase', isActive: true },
        { category: 'TIMETABLE_ROOM', value: 'Bibliothèque', labelFr: 'Bibliothèque', labelEn: 'Library', label: 'Bibliothèque', isActive: true },
        
        { category: 'TIMETABLE_TIME_SLOT', value: '07:00', labelFr: '07:00', labelEn: '07:00 AM', label: '07:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '08:00', labelFr: '08:00', labelEn: '08:00 AM', label: '08:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '09:00', labelFr: '09:00', labelEn: '09:00 AM', label: '09:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '10:00', labelFr: '10:00', labelEn: '10:00 AM', label: '10:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '11:00', labelFr: '11:00', labelEn: '11:00 AM', label: '11:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '12:00', labelFr: '12:00', labelEn: '12:00 PM', label: '12:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '13:00', labelFr: '13:00', labelEn: '01:00 PM', label: '13:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '14:00', labelFr: '14:00', labelEn: '02:00 PM', label: '14:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '15:00', labelFr: '15:00', labelEn: '03:00 PM', label: '15:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '16:00', labelFr: '16:00', labelEn: '04:00 PM', label: '16:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '17:00', labelFr: '17:00', labelEn: '05:00 PM', label: '17:00', isActive: true },
        { category: 'TIMETABLE_TIME_SLOT', value: '18:00', labelFr: '18:00', labelEn: '06:00 PM', label: '18:00', isActive: true },
      ];
      await this.repo.save(defaultOptions);
      this.logger.log('Options système par défaut créées avec succès.');
    }
  }

  private async ensureTimetableSlots() {
    const desired = [
      // Cours du jour
      { value: '08:00', labelFr: 'Cours 08:00 - 09:50', labelEn: 'Class 08:00 - 09:50' },
      { value: '09:50', labelFr: 'PP 09:50 - 10:05', labelEn: 'Break 09:50 - 10:05' },
      { value: '10:05', labelFr: 'Cours 10:05 - 12:00', labelEn: 'Class 10:05 - 12:00' },
      { value: '12:00', labelFr: 'GP 12:00 - 13:00', labelEn: 'Lunch 12:00 - 13:00' },
      { value: '13:00', labelFr: 'Cours 13:00 - 14:50', labelEn: 'Class 13:00 - 14:50' },
      { value: '14:50', labelFr: 'PP 14:50 - 15:05', labelEn: 'Break 14:50 - 15:05' },
      { value: '15:05', labelFr: 'Cours 15:05 - 17:00', labelEn: 'Class 15:05 - 17:00' },
      // Cours du soir
      { value: '17:30', labelFr: 'Cours 17:30 - 19:20', labelEn: 'Evening 17:30 - 19:20' },
      { value: '19:20', labelFr: 'PP 19:20 - 19:35', labelEn: 'Break 19:20 - 19:35' },
      { value: '19:35', labelFr: 'Cours 19:35 - 21:00', labelEn: 'Evening 19:35 - 21:00' },
    ];

    let inserted = 0;
    for (const d of desired) {
      const existing = await this.repo.findOne({ where: { category: 'TIMETABLE_TIME_SLOT', value: d.value } });
      if (!existing) {
        const option = this.repo.create({
          category: 'TIMETABLE_TIME_SLOT',
          value: d.value,
          labelFr: d.labelFr,
          labelEn: d.labelEn,
          label: d.labelFr,
          isActive: true,
        });
        await this.repo.save(option);
        inserted++;
      }
    }
    if (inserted > 0) {
      this.logger.log(`Ajout de ${inserted} créneau(x) jour/soir dans TIMETABLE_TIME_SLOT.`);
    }
  }

  constructor(
    @InjectRepository(SystemOption)
    private repo: Repository<SystemOption>,
  ) {}

  async create(dto: CreateSystemOptionDto) {
    const option = this.repo.create({
      ...dto,
      label: dto.label ?? dto.labelFr,
    });
    return await this.repo.save(option);
  }

  async findAll() {
    return await this.repo.find({ order: { category: 'ASC', labelFr: 'ASC' } });
  }

  async findByCategory(category: string) {
    return await this.repo.find({ where: { category, isActive: true }, order: { labelFr: 'ASC' } });
  }

  async update(id: number, dto: Partial<CreateSystemOptionDto>) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
