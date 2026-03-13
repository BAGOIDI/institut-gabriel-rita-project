import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSystemOptionDto {
  @IsString()
  category: string;

  @IsString()
  value: string;

  @IsString()
  labelFr: string;

  @IsString()
  labelEn: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
