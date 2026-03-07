import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // @Post('payments')
  // @ApiOperation({ summary: 'Record a new payment' })
  // @ApiResponse({ status: 201, description: 'Payment recorded successfully.' })
  // @ApiResponse({ status: 400, description: 'Validation failed.' })
  // @ApiResponse({ status: 404, description: 'Student Fee record not found.' })
  // async recordPayment(@Body() createPaymentDto: CreatePaymentDto) {
  //   return this.financeService.recordPayment(createPaymentDto);
  // }

  // @Get('students/:id/balance')
  // @ApiOperation({ summary: 'Get student balance' })
  // async getStudentBalance(@Param('id', ParseIntPipe) id: number) {
  //   return this.financeService.getStudentBalance(id);
  // }

  // @Get('reports/global')
  // @ApiOperation({ summary: 'Get global financial report' })
  // async getGlobalReport() {
  //   return this.financeService.getGlobalReport();
  // }
}