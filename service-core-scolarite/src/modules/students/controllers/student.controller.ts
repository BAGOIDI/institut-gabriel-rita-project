import { Controller, Post, UseInterceptors, UploadedFile, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService as StudentImportService } from '../services/student.service';

@Controller('students-import')
export class StudentImportController {
  constructor(
    @Inject('StudentImportService') private readonly service: StudentImportService
  ) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importStudents(@UploadedFile() file: any) {
    return await this.service.importFromExcel(file.buffer);
  }
}
