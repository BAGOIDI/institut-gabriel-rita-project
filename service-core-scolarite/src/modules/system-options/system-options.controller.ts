import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { SystemOptionsService } from './system-options.service';
import { CreateSystemOptionDto } from './dto/create-system-option.dto';

@Controller('system-options')
export class SystemOptionsController {
  constructor(private readonly service: SystemOptionsService) {}

  @Post()
  create(@Body() dto: CreateSystemOptionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string) {
    return this.service.findByCategory(category);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSystemOptionDto>) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
