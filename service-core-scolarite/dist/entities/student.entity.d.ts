import { User } from './user.entity';
import { Class } from './class.entity';
import { Invoice } from './invoice.entity';
import { Grade } from './grade.entity';
export declare class Student {
    id: string;
    user: User;
    matricule: string;
    firstName: string;
    lastName: string;
    class: Class;
    dateOfBirth: Date;
    gender: string;
    phone: string;
    parentPhone: string;
    balance: number;
    photoUrl: string;
    isActive: boolean;
    invoices: Invoice[];
    grades: Grade[];
}
