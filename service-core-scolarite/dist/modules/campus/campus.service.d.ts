import { Repository } from 'typeorm';
import { Campus } from './campus.entity';
import { CreateCampusDto, UpdateCampusDto } from './campus.dto';
export declare class CampusService {
    private campusRepository;
    constructor(campusRepository: Repository<Campus>);
    findAll(): Promise<Campus[]>;
    findOne(id: string): Promise<Campus>;
    create(createCampusDto: CreateCampusDto): Promise<Campus>;
    update(id: string, updateCampusDto: UpdateCampusDto): Promise<Campus>;
    remove(id: string): Promise<void>;
}
