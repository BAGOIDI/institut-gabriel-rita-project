import { Injectable } from '@nestjs/common';
import { LmsService } from '../../external/lms.service';
import { InvoiceService } from '../../external/invoice.service';
import { SnipeITService } from '../../external/snipeit.service';

@Injectable()
export class AggregatorService {
  constructor(
    private lms: LmsService,
    private invoice: InvoiceService,
    private snipeit: SnipeITService,
  ) {}

  async getStudentDashboard(email: string) {
    console.log(`⚡ Fetching dashboard data for ${email}...`);
    const [coursesResult, invoicesResult, assetsResult] = await Promise.allSettled([
      this.lms.getCourses(email),
      this.invoice.getInvoices(email),
      this.snipeit.getMyAssets(email),
    ]);

    const courses = coursesResult.status === 'fulfilled' ? coursesResult.value : [];
    const invoices = invoicesResult.status === 'fulfilled' ? invoicesResult.value : [];
    const assets = assetsResult.status === 'fulfilled' ? assetsResult.value : [];

    return {
      user: { email },
      widgets: {
        courses_count: courses.length,
        unpaid_amount: invoices.filter((i: any) => i.status === 'unpaid').reduce((sum: number, i: any) => sum + i.amount, 0),
        items_on_loan: assets.length,
      },
      data: { courses, invoices, assets }
    };
  }
}
