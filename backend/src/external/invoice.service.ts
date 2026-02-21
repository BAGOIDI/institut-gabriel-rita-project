import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class InvoiceService {
  constructor(private http: HttpService) {}
  async getInvoices(email: string) {
    return [
      { id: 'INV-001', amount: 500, status: 'paid' },
      { id: 'INV-002', amount: 500, status: 'unpaid' },
    ];
  }
}
