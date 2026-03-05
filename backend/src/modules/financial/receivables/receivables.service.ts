import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../common/utils/pagination.util';

@Injectable()
export class ReceivablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, filters?: {
    status?: string;
    clientId?: string;
    policyId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  }) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.policyId) where.policyId = filters.policyId;
    if (filters?.dueDateFrom || filters?.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.receivable.findMany({
        ...query,
        where,
        include: {
          client: { select: { id: true, name: true } },
          policy: { select: { id: true, policyNumber: true } },
        },
      }),
      this.prisma.receivable.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async findOne(tenantId: string, id: string) {
    const receivable = await this.prisma.receivable.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        policy: { include: { insurer: true, seller: true } },
        commissionPayments: true,
      },
    });

    if (!receivable) throw new NotFoundException('Parcela nao encontrada');
    return receivable;
  }

  async update(tenantId: string, id: string, dto: UpdateReceivableDto) {
    const receivable = await this.findOne(tenantId, id);

    const data: any = { ...dto };

    // Se marcou como recebido, define a data de recebimento
    if (dto.status === 'received' && !dto.receivedDate) {
      data.receivedDate = new Date();
    } else if (dto.receivedDate) {
      data.receivedDate = new Date(dto.receivedDate);
    }

    // Se editou o valor bruto, recalcula comissoes
    if (dto.grossAmountCents) {
      const policy = receivable.policy;
      data.brokerCommissionCents = Math.round(
        dto.grossAmountCents * Number(policy.brokerCommissionPct) / 100,
      );
      data.sellerCommissionCents = Math.round(
        dto.grossAmountCents * Number(policy.sellerCommissionPct) / 100,
      );
      data.netAmountCents =
        dto.grossAmountCents - data.brokerCommissionCents - data.sellerCommissionCents;
    }

    return this.prisma.receivable.update({ where: { id }, data });
  }

  async setPaymentProof(tenantId: string, id: string, url: string) {
    await this.findOne(tenantId, id);
    return this.prisma.receivable.update({
      where: { id },
      data: { paymentProofUrl: url },
    });
  }

  async markOverdue() {
    // Job: marca parcelas vencidas como atrasadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.receivable.updateMany({
      where: {
        status: 'pending',
        dueDate: { lt: today },
      },
      data: { status: 'overdue' },
    });

    return { updated: result.count };
  }
}
