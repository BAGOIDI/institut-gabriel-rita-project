import {
  Controller, Get, Post, Body, Param, ParseIntPipe,
  Query, Delete, Patch
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // -------------------------------------------------------
  // ROUTES attendues par le FRONTEND: GET /api/finance/finance
  // -------------------------------------------------------

  // // GET /finance — Liste tous les paiements (avec filtres optionnels)
  // @Get()
  // @ApiOperation({ summary: 'Lister tous les paiements' })
  // async findAll(
  //   @Query('page') page = '1',
  //   @Query('limit') limit = '20',
  //   @Query('type') type?: string,
  //   @Query('method') method?: string,
  //   @Query('studentId') studentId?: string,
  //   @Query('year') year?: string,
  //   @Query('month') month?: string,
  // ) {
  //   return this.financeService.findAll({
  //     page: parseInt(page, 10),
  //     limit: parseInt(limit, 10),
  //     type,
  //     method,
  //     studentId,
  //     year: year ? parseInt(year, 10) : undefined,
  //     month: month ? parseInt(month, 10) : undefined,
  //   });
  // }

  // // POST /finance — Créer un paiement (route principale frontend)
  // @Post()
  // @ApiOperation({ summary: 'Enregistrer un paiement' })
  // async createPayment(@Body() dto: any) {
  //   return this.financeService.createPaymentFull(dto);
  // }

  // // GET /finance/stats — Statistiques globales
  // @Get('stats')
  // @ApiOperation({ summary: 'Statistiques financières' })
  // async getStats(
  //   @Query('year') year?: string,
  //   @Query('month') month?: string,
  // ) {
  //   return this.financeService.getStats({
  //     year: year ? parseInt(year, 10) : undefined,
  //     month: month ? parseInt(month, 10) : undefined,
  //   });
  // }

  // // GET /finance/:id — Détail d'un paiement
  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return this.financeService.findOne(id);
  // }

  // // PATCH /finance/:id — Modifier un paiement
  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() dto: any) {
  //   return this.financeService.update(id, dto);
  // }

  // // DELETE /finance/:id — Supprimer un paiement
  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return this.financeService.remove(id);
  // }

  // -------------------------------------------------------
  // ROUTES supplémentaires (conservées)
  // -------------------------------------------------------

  // @Post('payments')
  // @ApiOperation({ summary: 'Enregistrer un paiement (route legacy)' })
  // async recordPayment(@Body() createPaymentDto: CreatePaymentDto) {
  //   return this.financeService.recordPayment(createPaymentDto);
  // }

  // @Get('students/:id/balance')
  // @ApiOperation({ summary: 'Solde étudiant' })
  // async getStudentBalance(@Param('id', ParseIntPipe) id: number) {
  //   return this.financeService.getStudentBalance(id);
  // }

  // @Get('reports/global')
  // @ApiOperation({ summary: 'Rapport financier global' })
  // async getGlobalReport() {
  //   return this.financeService.getGlobalReport();
  // }
}
