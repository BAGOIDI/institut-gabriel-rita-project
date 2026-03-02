import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FinanceModule } from './finance/finance.module';
import { Payment } from './finance/entities/payment.entity';
import { StudentFee } from './finance/entities/student-fee.entity';

@Module({
  imports: [
    // Load .env file
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Database Connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'scolarite_db',
      entities: [Payment, StudentFee], // Register Entities
      synchronize: true, // Auto-create tables (Dev only, use migrations in Prod)
    }),
    
    FinanceModule,
  ],
})
export class AppModule {}