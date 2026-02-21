import { Module } from '@nestjs/common';
import { StudentEventsController } from './events/student-events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AggregatorModule } from './modules/aggregator/aggregator.module';
import { StudentsModule } from './modules/students/students.module';
import { ExternalModule } from './external/external.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: 5432,
      username: process.env.POSTGRES_USER || 'admin_school',
      password: process.env.POSTGRES_PASSWORD || 'secure_password_123',
      database: process.env.POSTGRES_DB || 'school_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AggregatorModule,
    StudentsModule,
    ExternalModule,
  ],
})
export class AppModule {}
