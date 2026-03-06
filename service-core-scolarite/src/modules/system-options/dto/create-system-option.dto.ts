import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSystemOptionDto {
  @IsString()
  category: string;

  @IsString()
  value: string;

  @IsString()
  label: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
