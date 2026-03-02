import { User } from './user.entity';
export declare class Role {
    id: string;
    name: string;
    permissions: any;
    description: string;
    users: User[];
}
