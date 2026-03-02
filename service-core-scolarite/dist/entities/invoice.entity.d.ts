import { Student } from './student.entity';
import { Payment } from './payment.entity';
export declare class Invoice {
    id: string;
    student: Student;
    title: string;
    amount: number;
    dueDate: Date;
    status: string;
    payments: Payment[];
}
