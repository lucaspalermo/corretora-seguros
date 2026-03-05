import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, filters?: {
    search?: string;
    category?: string;
    type?: string;
    sellerId?: string;
  }) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId };
    if (filters?.search) {
      where.OR = [
        { policyNumber: { contains: filters.search } },
        { client: { name: { contains: filters.search } } },
      ];
    }
    if (filters?.category) where.category = filters.category;
    if (filters?.type) where.type = filters.type;
    if (filters?.sellerId) where.sellerId = filters.sellerId;

    const [items, total] = await Promise.all([
      this.prisma.policy.findMany({
        ...query,
        where,
        include: {
          client: { select: { id: true, name: true, document: true } },
          insurer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
        },
      }),
      this.prisma.policy.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async findOne(tenantId: string, id: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        insurer: true,
        seller: true,
        receivables: { orderBy: { installmentNumber: 'asc' } },
      },
    });

    if (!policy) throw new NotFoundException('Apolice nao encontrada');
    return policy;
  }

  async create(tenantId: string, dto: CreatePolicyDto) {
    // Cria apolice + gera parcelas em transacao
    return this.prisma.$transaction(async (tx) => {
      const policy = await tx.policy.create({
        data: {
          tenantId,
          clientId: dto.clientId,
          insurerId: dto.insurerId,
          sellerId: dto.sellerId,
          policyNumber: dto.policyNumber,
          category: dto.category,
          type: dto.type || 'active',
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
          premiumCents: dto.premiumCents,
          paymentMethod: dto.paymentMethod,
          installments: dto.installments,
          brokerCommissionPct: dto.brokerCommissionPct,
          sellerCommissionPct: dto.sellerCommissionPct,
          autoRenew: dto.autoRenew || false,
          notes: dto.notes,
        },
      });

      // Gerar parcelas automaticamente
      const installmentAmount = Math.floor(dto.premiumCents / dto.installments);
      const remainder = dto.premiumCents - (installmentAmount * dto.installments);

      const receivables: Array<{
        tenantId: string; policyId: string; clientId: string;
        installmentNumber: number; grossAmountCents: number;
        brokerCommissionCents: number; sellerCommissionCents: number;
        netAmountCents: number; dueDate: Date; status: 'pending';
      }> = [];
      for (let i = 1; i <= dto.installments; i++) {
        const grossAmount = i === 1 ? installmentAmount + remainder : installmentAmount;
        const brokerCommission = Math.round(grossAmount * dto.brokerCommissionPct / 100);
        const sellerCommission = Math.round(grossAmount * dto.sellerCommissionPct / 100);
        const netAmount = grossAmount - brokerCommission - sellerCommission;

        // Vencimento: mes a mes a partir da data de inicio
        const dueDate = new Date(dto.startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        receivables.push({
          tenantId,
          policyId: policy.id,
          clientId: dto.clientId,
          installmentNumber: i,
          grossAmountCents: grossAmount,
          brokerCommissionCents: brokerCommission,
          sellerCommissionCents: sellerCommission,
          netAmountCents: netAmount,
          dueDate,
          status: 'pending' as const,
        });
      }

      await tx.receivable.createMany({ data: receivables });

      // Gerar registros de comissao para o vendedor
      const commissions = receivables.map((r, idx) => ({
        tenantId,
        sellerId: dto.sellerId,
        receivableId: '', // Sera preenchido abaixo
        amountCents: r.sellerCommissionCents,
        status: 'pending' as const,
      }));

      // Busca os receivables criados para vincular as comissoes
      const createdReceivables = await tx.receivable.findMany({
        where: { policyId: policy.id },
        orderBy: { installmentNumber: 'asc' },
      });

      for (const rec of createdReceivables) {
        await tx.commissionPayment.create({
          data: {
            tenantId,
            sellerId: dto.sellerId,
            receivableId: rec.id,
            amountCents: rec.sellerCommissionCents,
            status: 'pending',
          },
        });
      }

      return this.findOne(tenantId, policy.id);
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePolicyDto) {
    await this.findOne(tenantId, id);

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.renewalDate) data.renewalDate = new Date(dto.renewalDate);
    if (dto.type === 'cancelled') data.cancelledAt = new Date();

    return this.prisma.policy.update({ where: { id }, data });
  }

  async cancel(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.policy.update({
        where: { id },
        data: { type: 'cancelled', cancelledAt: new Date() },
      });

      // Cancela parcelas pendentes
      await tx.receivable.updateMany({
        where: { policyId: id, status: 'pending' },
        data: { status: 'cancelled' },
      });

      // Cancela comissoes pendentes
      const pendingReceivables = await tx.receivable.findMany({
        where: { policyId: id, status: 'cancelled' },
        select: { id: true },
      });

      await tx.commissionPayment.updateMany({
        where: {
          receivableId: { in: pendingReceivables.map(r => r.id) },
          status: 'pending',
        },
        data: { status: 'cancelled' },
      });

      return { message: 'Apolice cancelada com sucesso' };
    });
  }
}
