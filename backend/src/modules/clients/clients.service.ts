import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../common/utils/pagination.util';
import { validateCPF, validateCNPJ } from '../../common/utils/cpf-cnpj.util';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, search?: string) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { document: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({ ...query, where }),
      this.prisma.client.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        policies: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { policies: true, receivables: true } },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente nao encontrado');
    }

    return client;
  }

  async create(tenantId: string, dto: CreateClientDto) {
    this.validateDocument(dto.document, dto.documentType);

    return this.prisma.client.create({
      data: {
        tenantId,
        ...dto,
        lgpdConsentAt: new Date(),
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(tenantId, id);

    if (dto.document && dto.documentType) {
      this.validateDocument(dto.document, dto.documentType);
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.client.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  private validateDocument(document: string, type: 'cpf' | 'cnpj') {
    if (type === 'cpf' && !validateCPF(document)) {
      throw new BadRequestException('CPF invalido');
    }
    if (type === 'cnpj' && !validateCNPJ(document)) {
      throw new BadRequestException('CNPJ invalido');
    }
  }
}
