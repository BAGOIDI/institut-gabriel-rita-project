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

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Penalty amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number;

  @ApiProperty({ description: 'Discount amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ description: 'Payment date', required: false })
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiProperty({ description: 'Reference', required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}
