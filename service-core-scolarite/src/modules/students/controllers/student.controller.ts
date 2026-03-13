import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from '../services/student.service';

@Controller('students')
export class StudentController {
  constructor(private readonly service: StudentService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importStudents(@UploadedFile() file: any) {
    return await this.service.importFromExcel(file.buffer);
  }
}
