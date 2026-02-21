import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CampusService } from './campus.service';
import { CreateCampusDto, UpdateCampusDto } from './campus.dto';

@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Post()
  async create(@Body() createCampusDto: CreateCampusDto) {
    return await this.campusService.create(createCampusDto);
  }

  @Get()
  async findAll() {
    return await this.campusService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.campusService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCampusDto: UpdateCampusDto,
  ) {
    return await this.campusService.update(id, updateCampusDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.campusService.remove(id);
  }
}