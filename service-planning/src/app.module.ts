import { CourseModule } from './modules/course/course.module';
import { SchedulesModule } from './modules/schedules/schedule.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CourseModule,
    SchedulesModule,

    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'institut_db',
      autoLoadEntities: true,
      synchronize: false, // Désactivé pour éviter les conflits de schéma
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}