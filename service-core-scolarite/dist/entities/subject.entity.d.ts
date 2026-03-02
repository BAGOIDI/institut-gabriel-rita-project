import { Class } from './class.entity';
import { Semester } from './semester.entity';
import { Grade } from './grade.entity';
export declare class Subject {
    id: string;
    name: string;
    code: string;
    class: Class;
    semester: Semester;
    coefficient: number;
    creditsEcts: number;
    grades: Grade[];
}
