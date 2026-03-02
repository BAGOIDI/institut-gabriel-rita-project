import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Payment } from './entities/payment.entity';
import { StudentFee } from './entities/student-fee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, StudentFee])],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}