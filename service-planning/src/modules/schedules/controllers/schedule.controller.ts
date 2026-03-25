import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ScheduleService } from '../services/schedule.service';
import { CreateSchedulePayload } from '../payloads/create-schedule.payload';
import { UpdateSchedulePayload } from '../payloads/update-schedule.payload';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('schedules')
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new schedule' })
  async create(@Body() payload: CreateSchedulePayload) {
    return await this.service.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedules' })
  async findAll(
    @Query('classId') classId?: string, 
    @Query('roomId') roomId?: string,
    @Query('staffId') staffId?: string,
  ) {
    return await this.service.findAll({ classId, roomId, staffId });
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Get schedules for a specific class' })
  async findByClass(@Param('classId', ParseIntPipe) classId: number) {
    return await this.service.findByClass(classId);
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get schedules for a specific staff' })
  async findByStaff(@Param('staffId', ParseIntPipe) staffId: number) {
    return await this.service.findByStaff(staffId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a schedule by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a schedule' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateSchedulePayload) {
    return await this.service.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a schedule' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.service.remove(id);
  }
}
