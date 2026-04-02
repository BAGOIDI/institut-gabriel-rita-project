import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradesService } from './grades.service';
import { BulkUpsertGradesDto } from './dto/bulk-upsert-grades.dto';

class GradesQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  studentId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  evaluationId?: number;
}

@Controller('grades')
export class GradesController {
  constructor(private readonly service: GradesService) {}

  @Post()
  create(@Body() dto: CreateGradeDto) {
    return this.service.create(dto);
  }

  @Post('bulk-upsert')
  bulkUpsert(@Body() dto: BulkUpsertGradesDto) {
    return this.service.bulkUpsert(dto);
  }

  @Get()
  findAll(@Query() q: GradesQueryDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGradeDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}

