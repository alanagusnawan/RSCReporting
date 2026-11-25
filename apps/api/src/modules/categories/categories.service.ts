import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export const DEFAULT_CATEGORIES = [
  'Financial',
  'Logistics',
  'Operations',
  'Analytics',
];

@Injectable()
export class CategoriesService {
  private logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (!this.prisma.isConnected) {
      return DEFAULT_CATEGORIES.map((c, i) => ({ id: `cat-${i + 1}`, name: c }));
    }

    try {
      let categories = await this.prisma.category.findMany({
        orderBy: { name: 'asc' },
      });

      // Seed defaults if empty
      if (categories.length === 0) {
        for (const name of DEFAULT_CATEGORIES) {
          try {
            await this.prisma.category.create({ data: { name } });
          } catch {}
        }
        categories = await this.prisma.category.findMany({
          orderBy: { name: 'asc' },
        });
      }

      return categories;
    } catch (e: any) {
      this.logger.warn(`Could not read categories from DB: ${e.message}`);
      return DEFAULT_CATEGORIES.map((c, i) => ({ id: `cat-${i + 1}`, name: c }));
    }
  }

  async create(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConflictException('Category name cannot be empty');
    }

    if (!this.prisma.isConnected) {
      return { id: `cat-${Date.now()}`, name: trimmed };
    }

    try {
      return await this.prisma.category.create({
        data: { name: trimmed },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Category "${trimmed}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConflictException('Category name cannot be empty');
    }

    if (!this.prisma.isConnected) {
      return { id, name: trimmed };
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name: trimmed },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Category "${trimmed}" already exists`);
      }
      throw new NotFoundException(`Category not found`);
    }
  }

  async remove(id: string) {
    if (!this.prisma.isConnected) {
      return { success: true };
    }

    try {
      await this.prisma.category.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException(`Category not found`);
    }
  }
}
