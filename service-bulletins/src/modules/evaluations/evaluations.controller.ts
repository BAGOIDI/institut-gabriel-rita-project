import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationsService } from './evaluations.service';

class EvaluationsQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  subjectId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  academicYearId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  semesterId?: number;

  @IsOptional()
  @IsIn(['CC', 'SN', 'RA', 'TP', 'PROJET'])
  type?: 'CC' | 'SN' | 'RA' | 'TP' | 'PROJET';

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'CLOSED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly service: EvaluationsService) {}

  @Post()
  create(@Body() dto: CreateEvaluationDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: EvaluationsQueryDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEvaluationDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}

