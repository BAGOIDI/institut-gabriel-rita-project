import { CampusService } from './campus.service';
import { CreateCampusDto, UpdateCampusDto } from './campus.dto';
export declare class CampusController {
    private readonly campusService;
    constructor(campusService: CampusService);
    create(createCampusDto: CreateCampusDto): Promise<import("./campus.entity").Campus>;
    findAll(): Promise<import("./campus.entity").Campus[]>;
    findOne(id: string): Promise<import("./campus.entity").Campus>;
    update(id: string, updateCampusDto: UpdateCampusDto): Promise<import("./campus.entity").Campus>;
    remove(id: string): Promise<void>;
}
