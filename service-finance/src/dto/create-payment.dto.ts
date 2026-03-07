import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  studentFeeId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY'])
  method?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
