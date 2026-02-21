import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campus } from './campus.entity';
import { CampusController } from './campus.controller';
import { CampusService } from './campus.service';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campus, User])],
  controllers: [CampusController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}