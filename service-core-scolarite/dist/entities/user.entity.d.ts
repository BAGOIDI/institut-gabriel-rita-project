import { Role } from './role.entity';
import { Campus } from '../modules/campus/campus.entity';
import { Staff } from './staff.entity';
import { Student } from './student.entity';
export declare class User {
    id: string;
    username: string;
    passwordHash: string;
    email: string;
    isActive: boolean;
    lastLogin: Date;
    role: Role;
    campus: Campus;
    staffProfile: Staff;
    studentProfile: Student;
}
