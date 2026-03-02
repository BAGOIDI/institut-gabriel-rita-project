import { User } from '../../entities/user.entity';
import { Class } from '../../entities/class.entity';
export declare class Campus {
    id: string;
    name: string;
    city: string;
    address: string;
    isActive: boolean;
    users: User[];
    classes: Class[];
}
