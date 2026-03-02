import { AcademicYear } from './academic-year.entity';
import { Subject } from './subject.entity';
export declare class Semester {
    id: string;
    name: string;
    academicYear: AcademicYear;
    startDate: Date;
    endDate: Date;
    subjects: Subject[];
}
