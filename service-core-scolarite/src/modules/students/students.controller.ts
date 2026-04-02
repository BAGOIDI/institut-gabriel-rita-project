import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StudentService } from './students.service';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() body: any) {
    return this.studentService.create(body);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('classId') classId?: string,
  ) {
    return this.studentService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    }, classId ? Number(classId) : undefined);
  }

  @Get('search')
  search(
    @Query('q') q?: string,
    @Query('classRoom') classRoom?: string,
    @Query('filiere') filiere?: string,
    @Query('specialStatus') specialStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studentService.search(
      { q, classRoom, filiere, specialStatus },
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.studentService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Post('import')
  import(@Body() rows: any[]) {
    return this.studentService.importFromJson(rows);
  }
}
