import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ========== PAYMENTS CRUD ==========

  @Post('payments')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Student Fee record not found.' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.financeService.createPayment(createPaymentDto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Returns all payments.' })
  async findAllPayments() {
    return this.financeService.findAllPayments();
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Returns the payment.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async findPaymentById(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.findPaymentById(id);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async updatePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.financeService.updatePayment(id, updatePaymentDto);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async deletePayment(@Param('id', ParseIntPipe) id: number) {
    await this.financeService.deletePayment(id);
    return { message: 'Payment deleted successfully' };
  }

  // ========== STUDENT FEES CRUD ==========

  @Post('fees')
  @ApiOperation({ summary: 'Create a new student fee record' })
  @ApiResponse({ status: 201, description: 'Fee created successfully.' })
  async createStudentFee(
    @Body('studentId', ParseIntPipe) studentId: number,
    @Body('totalDue') totalDue: number,
  ) {
    return this.financeService.createStudentFee(studentId, totalDue);
  }

  @Get('fees')
  @ApiOperation({ summary: 'Get all student fees' })
  @ApiResponse({ status: 200, description: 'Returns all student fees.' })
  async findAllStudentFees() {
    return this.financeService.findAllStudentFees();
  }

  @Get('fees/:id')
  @ApiOperation({ summary: 'Get student fee by ID' })
  @ApiResponse({ status: 200, description: 'Returns the fee.' })
  @ApiResponse({ status: 404, description: 'Fee not found.' })
  async findStudentFeeById(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.findStudentFeeById(id);
  }

  @Put('fees/:id')
  @ApiOperation({ summary: 'Update a student fee' })
  @ApiResponse({ status: 200, description: 'Fee updated successfully.' })
  @ApiResponse({ status: 404, description: 'Fee not found.' })
  async updateStudentFee(
    @Param('id', ParseIntPipe) id: number,
    @Body('totalDue') totalDue: number,
  ) {
    return this.financeService.updateStudentFee(id, totalDue);
  }

  @Delete('fees/:id')
  @ApiOperation({ summary: 'Delete a student fee' })
  @ApiResponse({ status: 200, description: 'Fee deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Fee not found.' })
  async deleteStudentFee(@Param('id', ParseIntPipe) id: number) {
    await this.financeService.deleteStudentFee(id);
    return { message: 'Student fee deleted successfully' };
  }

  // ========== BALANCE & REPORTS ==========

  @Get('students/:id/balance')
  @ApiOperation({ summary: 'Get student balance' })
  @ApiResponse({ status: 200, description: 'Returns student balance.' })
  async getStudentBalance(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.getStudentBalance(id);
  }

  @Get('reports/global')
  @ApiOperation({ summary: 'Get global financial report' })
  @ApiResponse({ status: 200, description: 'Returns global report.' })
  async getGlobalReport() {
    return this.financeService.getGlobalReport();
  }

  @Get('payments/by-date')
  @ApiOperation({ summary: 'Get payments by date range' })
  @ApiResponse({ status: 200, description: 'Returns payments in date range.' })
  async getPaymentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getPaymentsByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }
}