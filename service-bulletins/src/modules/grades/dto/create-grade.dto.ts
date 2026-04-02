import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGradeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  evaluationId: number;

  @IsOptional()
  @IsString()
  anonymityCode?: string;

  @IsOptional()
  @IsString()
  score?: string;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean = false;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

