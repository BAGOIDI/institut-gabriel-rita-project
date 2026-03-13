import { Injectable } from '@nestjs/common';
import { StudentRepository } from '../repositories/student.repository';
import { ExcelProvider } from '../providers/excel.provider';

@Injectable()
export class StudentService {
  constructor(
    private readonly repo: StudentRepository,
    private readonly excelProvider: ExcelProvider
  ) {}

  async importFromExcel(buffer: Buffer) {
    const data = this.excelProvider.parseBuffer(buffer);
    let count = 0;
    for (const row of data) {
      const student = this.repo.create({
        matricule: row['Matricule'] || `MAT-${Date.now()}-${count}`,
        first_name: row['Prenom'] || '',
        last_name: row['Nom'] || 'Inconnu'
      });
      await this.repo.save(student);
      count++;
    }
    return { imported: count };
  }
}