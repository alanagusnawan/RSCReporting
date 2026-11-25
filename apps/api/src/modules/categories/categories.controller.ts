import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async list() {
    return this.categoriesService.findAll();
  }

  @Post()
  async create(@Body('name') name: string) {
    return this.categoriesService.create(name);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body('name') name: string) {
    return this.categoriesService.update(id, name);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
