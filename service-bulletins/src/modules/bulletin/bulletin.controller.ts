import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BulletinService } from './bulletin.service';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';

@Controller('bulletin')
export class BulletinController {
  constructor(private readonly bulletinService: BulletinService) {}

  @Post()
  create(@Body() createBulletinDto: CreateBulletinDto) {
    return this.bulletinService.create(createBulletinDto);
  }

  @Get()
  findAll() {
    return this.bulletinService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bulletinService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBulletinDto: UpdateBulletinDto) {
    return this.bulletinService.update(id, updateBulletinDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bulletinService.remove(id);
  }
}
