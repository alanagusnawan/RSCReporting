import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Controller('api/v1/data-sources')
export class DataSourcesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    try {
      return await this.prisma.dataSourceRecord.findMany({
        orderBy: { updatedAt: 'desc' },
      });
    } catch {
      return [];
    }
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const ds = await this.prisma.dataSourceRecord.findUnique({
      where: { id },
    });
    if (!ds) {
      throw new NotFoundException(`Data source '${id}' not found`);
    }
    return ds;
  }

  @Post()
  async create(@Body() body: any) {
    const { id, name, providerType, configuration } = body;
    return await this.prisma.dataSourceRecord.create({
      data: {
        id: id || undefined,
        name: name || 'JSON Data Source',
        providerType: providerType || 'inline',
        configuration: configuration || {},
        status: 'active',
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const { name, providerType, configuration, status } = body;
    return await this.prisma.dataSourceRecord.upsert({
      where: { id },
      create: {
        id,
        name: name || id,
        providerType: providerType || 'inline',
        configuration: configuration || {},
        status: status || 'active',
      },
      update: {
        name: name || undefined,
        providerType: providerType || undefined,
        configuration: configuration || undefined,
        status: status || undefined,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.prisma.dataSourceRecord.delete({
      where: { id },
    });
  }
}
