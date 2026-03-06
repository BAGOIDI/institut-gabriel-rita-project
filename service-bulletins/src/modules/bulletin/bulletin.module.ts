import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulletinService } from './bulletin.service';
import { BulletinController } from './bulletin.controller';
import { Bulletin } from './entities/bulletin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bulletin])],
  controllers: [BulletinController],
  providers: [BulletinService],
  exports: [BulletinService],
})
export class BulletinModule {}
