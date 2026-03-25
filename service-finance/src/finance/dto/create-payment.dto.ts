import { IsNumber, IsPositive, IsString, IsEnum, IsInt, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'The ID of the student fee record', example: 1 })
  @IsInt()
  @Min(1)
  studentFeeId: number;

  @ApiProperty({ description: 'Student full name (for history)', required: false })
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiProperty({ description: 'Student matricule (for history)', required: false })
  @IsOptional()
  @IsString()
  studentMatricule?: string;

  @ApiProperty({ description: 'Amount paid', example: 50000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'ID of the user recording the payment', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ description: 'Payment date', example: '2024-03-16', required: false })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Penalty amount', example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number;

  @ApiProperty({ description: 'Discount amount', example: 10000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ description: 'External reference number', example: 'TXN123456', required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}