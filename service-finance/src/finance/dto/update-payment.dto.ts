import { IsNumber, IsPositive, IsString, IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class UpdatePaymentDto {
  @ApiProperty({ description: 'The ID of the student fee record', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  studentFeeId?: number;

  @ApiProperty({ description: 'Amount paid', example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiProperty({ description: 'ID of the user recording the payment', example: 1, required: false })
  @IsOptional()
  @IsInt()
  userId?: number;
}
