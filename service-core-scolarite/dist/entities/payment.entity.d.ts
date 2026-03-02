import { Student } from './student.entity';
import { Invoice } from './invoice.entity';
export declare class Payment {
    id: string;
    student: Student;
    invoice: Invoice;
    amount: number;
    method: string;
    reference: string;
    paymentDate: Date;
}
