import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository('Student')
    private studentRepository: Repository<any>,
    @InjectRepository('Staff')
    private staffRepository: Repository<any>,
  ) {}

  /**
   * Compte le nombre total d'étudiants dans la base
   */
  async countStudents(): Promise<number> {
    return await this.studentRepository.count();
  }

  /**
   * Compte le nombre total d'enseignants dans la base
   */
  async countTeachers(): Promise<number> {
    return await this.staffRepository.count({
      where: { contractType: 'TEACHING' }
    });
  }

  /**
   * Récupère un échantillon d'étudiants
   */
  async getSampleStudents(limit: number = 5) {
    return await this.studentRepository.find({
      take: limit,
      select: ['id', 'first_name', 'last_name', 'email', 'status']
    });
  }

  /**
   * Récupère un échantillon d'enseignants
   */
  async getSampleTeachers(limit: number = 5) {
    return await this.staffRepository.find({
      where: { contractType: 'TEACHING' },
      take: limit,
      select: ['id', 'firstName', 'lastName', 'email', 'specialty']
    });
  }

  /**
   * Statistiques générales de la base de données
   */
  async getStats() {
    const studentCount = await this.countStudents();
    const teacherCount = await this.countTeachers();
    
    return {
      students: {
        total: studentCount,
        sample: await this.getSampleStudents(3)
      },
      teachers: {
        total: teacherCount,
        sample: await this.getSampleTeachers(3)
      },
      timestamp: new Date().toISOString()
    };
  }
}
