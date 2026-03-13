import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './controllers/payroll.controller';
import { PayrollService } from './services/payroll.service';
import { PayrollRepository } from './repositories/payroll.repository';
import { PayrollSlip } from './entities/payroll-slip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PayrollSlip])],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollRepository],
  exports: [PayrollService]
})
export class PayrollModule {}