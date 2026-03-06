import { PartialType } from '@nestjs/mapped-types';
import { CreateGradeDto } from './create-grades.dto';

export class UpdateGradeDto extends PartialType(CreateGradeDto) {}
