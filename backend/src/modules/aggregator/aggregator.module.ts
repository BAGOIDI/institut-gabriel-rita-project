import { Module } from '@nestjs/common';
import { AggregatorController } from './aggregator.controller';
import { AggregatorService } from './aggregator.service';
import { ExternalModule } from '../../external/external.module';

@Module({
  imports: [ExternalModule],
  controllers: [AggregatorController],
  providers: [AggregatorService],
})
export class AggregatorModule {}
