import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Payment } from './entities/payment.entity';
import { StudentFee } from './entities/student-fee.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Disbursement } from './entities/disbursement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, StudentFee, PaymentPlan, Disbursement]),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
          queue: 'school_events',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}