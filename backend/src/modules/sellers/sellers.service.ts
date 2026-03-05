import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../common/utils/pagination.util';
import { validateCPF } from '../../common/utils/cpf-cnpj.util';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, search?: string) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { cpf: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({ ...query, where }),
      this.prisma.seller.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async findOne(tenantId: string, id: string) {
    const seller = await this.prisma.seller.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { policies: true, commissionPayments: true } },
      },
    });

    if (!seller) throw new NotFoundException('Vendedor nao encontrado');
    return seller;
  }

  async create(tenantId: string, dto: CreateSellerDto) {
    if (!validateCPF(dto.cpf)) {
      throw new BadRequestException('CPF invalido');
    }

    return this.prisma.seller.create({
      data: { tenantId, ...dto },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateSellerDto) {
    await this.findOne(tenantId, id);

    if (dto.cpf && !validateCPF(dto.cpf)) {
      throw new BadRequestException('CPF invalido');
    }

    return this.prisma.seller.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.seller.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
