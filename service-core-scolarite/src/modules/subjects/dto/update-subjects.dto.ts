import { PartialType } from '@nestjs/mapped-types';
import { CreateSubjectDto } from './create-subjects.dto';

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}
