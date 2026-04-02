import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TeacherSubjectClassService } from './teacher-subject-class.service';

@Controller('teacher-subject-class')
export class TeacherSubjectClassController {
  constructor(private readonly service: TeacherSubjectClassService) {}

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Post('sync/:staffId')
  sync(@Param('staffId') staffId: string, @Body() assignments: { classId: number; subjectId: number }[]) {
    return this.service.syncTeacherAssignments(Number(staffId), assignments);
  }

  @Get()
  findAll(
    @Query('staffId') staffId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('classId') classId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.findAll({
      staffId: staffId ? Number(staffId) : undefined,
      subjectId: subjectId ? Number(subjectId) : undefined,
      classId: classId ? Number(classId) : undefined,
      academicYearId: academicYearId ? Number(academicYearId) : undefined,
    });
  }

  @Get('teachers-by-class/:classId')
  findTeachersByClass(@Param('classId') classId: string) {
    return this.service.findTeachersByClass(Number(classId));
  }

  @Get('subjects-by-class/:classId')
  findSubjectsByClass(@Param('classId') classId: string) {
    return this.service.findSubjectsByClass(Number(classId));
  }

  @Get('classes-by-teacher/:staffId')
  findClassesByTeacher(@Param('staffId') staffId: string) {
    return this.service.findClassesByTeacher(Number(staffId));
  }

  @Get('subjects-by-teacher/:staffId')
  findSubjectsByTeacher(@Param('staffId') staffId: string) {
    return this.service.findSubjectsByTeacher(Number(staffId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
