import { Controller, Post, Body } from '@nestjs/common';
import { PayrollService } from '../services/payroll.service';
import { GeneratePayrollPayload } from '../payloads/generate-payroll.payload';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate')
  async generateSlip(@Body() payload: GeneratePayrollPayload) {
    return await this.payrollService.generateSlip(payload);
  }
}