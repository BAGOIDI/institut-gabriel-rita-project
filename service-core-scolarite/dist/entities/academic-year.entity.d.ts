import { Semester } from './semester.entity';
export declare class AcademicYear {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    semesters: Semester[];
}
