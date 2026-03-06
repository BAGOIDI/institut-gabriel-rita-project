import { PartialType } from '@nestjs/mapped-types';
import { CreateSpecialtyDto } from './create-specialtys.dto';

export class UpdateSpecialtyDto extends PartialType(CreateSpecialtyDto) {}
