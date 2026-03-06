import { PartialType } from '@nestjs/mapped-types';
import { CreateSemesterDto } from './create-semesters.dto';

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}
