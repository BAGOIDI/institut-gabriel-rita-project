import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LmsService } from './lms.service';
import { InvoiceService } from './invoice.service';
import { SnipeITService } from './snipeit.service';

@Module({
  imports: [HttpModule],
  providers: [LmsService, InvoiceService, SnipeITService],
  exports: [LmsService, InvoiceService, SnipeITService],
})
export class ExternalModule {}
