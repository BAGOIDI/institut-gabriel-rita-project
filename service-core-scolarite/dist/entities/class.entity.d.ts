import { Specialty } from './specialty.entity';
import { AcademicYear } from './academic-year.entity';
import { Campus } from '../modules/campus/campus.entity';
import { Student } from './student.entity';
export declare class Class {
    id: string;
    name: string;
    tuitionFee: number;
    specialty: Specialty;
    academicYear: AcademicYear;
    campus: Campus;
    students: Student[];
}
