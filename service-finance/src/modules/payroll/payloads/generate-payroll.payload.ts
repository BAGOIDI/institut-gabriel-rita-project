import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
export class GeneratePayrollPayload {
  @IsNumber() @IsNotEmpty() staffId: number;
  @IsString() @IsNotEmpty() month: string; // YYYY-MM
}