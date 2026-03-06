import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemOptionsService } from './system-options.service';
import { SystemOptionsController } from './system-options.controller';
import { SystemOption } from './system-option.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemOption])],
  controllers: [SystemOptionsController],
  providers: [SystemOptionsService],
  exports: [SystemOptionsService],
})
export class SystemOptionsModule {}
