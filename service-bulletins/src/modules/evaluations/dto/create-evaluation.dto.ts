import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EvaluationStatus, EvaluationType } from '../entities/evaluation.entity';

export class CreateEvaluationDto {
  @Type(() => Number)
  @IsInt()
  subjectId: number;

  @Type(() => Number)
  @IsInt()
  academicYearId: number;

  @Type(() => Number)
  @IsInt()
  semesterId: number;

  @IsString()
  name: string;

  @IsIn(['CC', 'SN', 'RA', 'TP', 'PROJET'] satisfies EvaluationType[])
  type: EvaluationType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  weightPercent?: number = 100;

  @IsOptional()
  maxScore?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'CLOSED'] satisfies EvaluationStatus[])
  status?: EvaluationStatus = 'DRAFT';
}

