import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

class StaffQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
  @IsOptional()
  @IsString()
  status?: string;
  @IsOptional()
  @IsString()
  specialty?: string;
  @IsOptional()
  @IsString()
  contractType?: string;
  @IsOptional()
  @IsString()
  classId?: string;
  @IsOptional()
  @IsString()
  subjectId?: string;
  @IsOptional()
  @IsString()
  page?: string;
  @IsOptional()
  @IsString()
  limit?: string;
}

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Post('import')
  importMany(@Body() rows: CreateStaffDto[]) {
    return this.staffService.importMany(rows);
  }

  @Get()
  findAll(@Query() query: StaffQueryDto) {
    return this.staffService.findAll({
      q: query.q,
      status: query.status,
      specialty: query.specialty,
      contractType: query.contractType,
      classId: query.classId ? Number(query.classId) : undefined,
      subjectId: query.subjectId ? Number(query.subjectId) : undefined,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(Number(id));
  }

  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(Number(id), updateStaffDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(Number(id), updateStaffDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.remove(Number(id));
  }
}
