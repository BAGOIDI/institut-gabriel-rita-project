import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { FinanceService, PaginatedResult } from './finance.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { PaymentDateRangeDto } from './dto/payment-date-range.dto';
import { Payment } from './entities/payment.entity';
import { Disbursement } from './entities/disbursement.entity';

@ApiTags('finance')
@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ========== PAYMENTS CRUD ==========

  @Post('payments')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Student Fee record not found.' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.financeService.createPayment(createPaymentDto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated payments.' })
  async findAllPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('date') date?: string,
    @Query('q') q?: string,
    @Query('method') method?: string,
  ): Promise<PaginatedResult<Payment>> {
    return this.financeService.findAllPayments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      date,
      q,
      method,
    });
  }

  @Get('payments/search')
  @ApiOperation({ summary: 'Search payments' })
  @ApiResponse({ status: 200, description: 'Returns search results.' })
  async searchPayments(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<Payment>> {
    return this.financeService.searchPayments(query, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get('payments/by-date')
  @ApiOperation({ summary: 'Get payments by date' })
  @ApiResponse({ status: 200, description: 'Returns payments for a specific date range.' })
  async getPaymentsByDate(@Query() query: any) {
    console.log('DEBUG: Received query for payments/by-date:', query);
    
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.financeService.getPaymentsByDateRange(
      startDate,
      endDate,
      {
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 50,
      },
      query.method,
      query.q,
    );
  }

  @Get('payments/export/csv')
  @ApiOperation({ summary: 'Export payments to CSV' })
  async exportPaymentsCsv(@Res() res: Response, @Query() query: any) {
    let startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;

    // Handle single date filter from UI
    if (query.date) {
      startDate = new Date(query.date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(query.date);
      endDate.setHours(23, 59, 59, 999);
    }

    const csvData = await this.financeService.getPaymentsCsv(startDate, endDate, query.method, query.q);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=paiements-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvData);
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

  @Post('payments/:id/cancel')
  @ApiOperation({ summary: 'Cancel a payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async cancelPayment(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.cancelPayment(id);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Soft delete a payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async deletePayment(@Param('id', ParseIntPipe) id: number) {
    await this.financeService.deletePayment(id);
    return { message: 'Payment deleted successfully' };
  }

  @Post('payments/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted payment' })
  @ApiResponse({ status: 200, description: 'Payment restored successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async restorePayment(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.restorePayment(id);
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

  @Get('stats')
  @ApiOperation({ summary: 'Get financial statistics' })
  @ApiResponse({ status: 200, description: 'Returns financial statistics.' })
  async getStats(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.financeService.getStats({
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });
  }

  @Get('students/:id/fees')
  @ApiOperation({ summary: 'Get all fees for a student' })
  @ApiResponse({ status: 200, description: 'Returns student fees.' })
  async getStudentFees(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.getStudentFees(id);
  }

  @Get('reports/student/:id')
  @ApiOperation({ summary: 'Get detailed report for a student' })
  @ApiResponse({ status: 200, description: 'Returns detailed student report.' })
  async getStudentReport(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.getStudentReport(id);
  }

  // ========== DISBURSEMENTS (DÉCAISSEMENTS) ==========

  @Post('disbursements')
  @ApiOperation({ summary: 'Create a new disbursement' })
  @ApiResponse({ status: 201, description: 'Disbursement created successfully.' })
  async createDisbursement(@Body() dto: CreateDisbursementDto): Promise<Disbursement> {
    return this.financeService.createDisbursement(dto);
  }

  @Post('disbursements/:id/cancel')
  @ApiOperation({ summary: 'Cancel a disbursement' })
  @ApiResponse({ status: 200, description: 'Disbursement cancelled successfully.' })
  @ApiResponse({ status: 404, description: 'Disbursement not found.' })
  async cancelDisbursement(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.cancelDisbursement(id);
  }

  @Post('disbursements/:id/restore')
  @ApiOperation({ summary: 'Restore a cancelled disbursement' })
  @ApiResponse({ status: 200, description: 'Disbursement restored successfully.' })
  @ApiResponse({ status: 404, description: 'Disbursement not found.' })
  async restoreDisbursement(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.restoreDisbursement(id);
  }

  @Get('disbursements')
  @ApiOperation({ summary: 'Get all disbursements with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated disbursements.' })
  async findAllDisbursements(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('date') date?: string,
    @Query('q') q?: string,
    @Query('method') method?: string,
  ): Promise<PaginatedResult<Disbursement>> {
    return this.financeService.findAllDisbursements({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      date,
      q,
      method,
    });
  }

  @Get('disbursements/by-type')
  @ApiOperation({ summary: 'Get disbursements by type' })
  @ApiResponse({ status: 200, description: 'Returns disbursements by type.' })
  async getDisbursementsByType(
    @Query('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financeService.getDisbursementsByType(type as any, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get('disbursements/stats')
  @ApiOperation({ summary: 'Get disbursement statistics' })
  @ApiResponse({ status: 200, description: 'Returns disbursement statistics.' })
  async getDisbursementStats(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.financeService.getDisbursementStats({
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });
  }
}