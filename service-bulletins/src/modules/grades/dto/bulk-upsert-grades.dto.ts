import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class BulkUpsertGradeItemDto {
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
  score?: string;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class BulkUpsertGradesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertGradeItemDto)
  items: BulkUpsertGradeItemDto[];

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

