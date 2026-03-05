import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class InsurersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, search?: string) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId };
    if (search) {
      where.name = { contains: search };
    }

    const [items, total] = await Promise.all([
      this.prisma.insurer.findMany({ ...query, where }),
      this.prisma.insurer.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async findOne(tenantId: string, id: string) {
    const insurer = await this.prisma.insurer.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { policies: true } } },
    });

    if (!insurer) throw new NotFoundException('Operadora nao encontrada');
    return insurer;
  }

  async create(tenantId: string, dto: CreateInsurerDto) {
    return this.prisma.insurer.create({
      data: { tenantId, ...dto },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInsurerDto) {
    await this.findOne(tenantId, id);
    return this.prisma.insurer.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.insurer.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
