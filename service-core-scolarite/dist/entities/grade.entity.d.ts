import { Student } from './student.entity';
import { Subject } from './subject.entity';
export declare class Grade {
    id: string;
    student: Student;
    subject: Subject;
    score: number;
    isAbsent: boolean;
    comments: string;
}
