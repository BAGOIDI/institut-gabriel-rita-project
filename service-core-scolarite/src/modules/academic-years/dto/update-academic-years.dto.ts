import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicYearDto } from './create-academic-years.dto';

export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {}
