import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('attendance')
export class AttendanceController {
  @Get()
  findAll() {
    return [];
  }
  
  @Post()
  create(@Body() data: any) {
    return { success: true, data };
  }
}
