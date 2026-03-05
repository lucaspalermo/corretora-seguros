import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../common/utils/pagination.util';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, filters?: {
    sellerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId };
    if (filters?.sellerId) where.sellerId = filters.sellerId;
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.commissionPayment.findMany({
        ...query,
        where,
        include: {
          seller: { select: { id: true, name: true } },
          receivable: {
            select: {
              id: true,
              installmentNumber: true,
              grossAmountCents: true,
              policy: { select: { id: true, policyNumber: true } },
            },
          },
        },
      }),
      this.prisma.commissionPayment.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async markAsPaid(tenantId: string, id: string) {
    const commission = await this.prisma.commissionPayment.findFirst({
      where: { id, tenantId },
    });

    if (!commission) throw new NotFoundException('Comissao nao encontrada');

    return this.prisma.commissionPayment.update({
      where: { id },
      data: { status: 'paid', paidDate: new Date() },
    });
  }

  async getSummaryBySeller(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const sellers = await this.prisma.seller.findMany({
      where: { tenantId, status: 'active' },
      select: {
        id: true,
        name: true,
        commissionPayments: {
          where,
          select: { amountCents: true, status: true },
        },
      },
    });

    return sellers.map((seller) => {
      const total = seller.commissionPayments.reduce((acc, c) => acc + c.amountCents, 0);
      const paid = seller.commissionPayments
        .filter((c) => c.status === 'paid')
        .reduce((acc, c) => acc + c.amountCents, 0);
      const pending = total - paid;

      return {
        sellerId: seller.id,
        sellerName: seller.name,
        totalCents: total,
        paidCents: paid,
        pendingCents: pending,
        count: seller.commissionPayments.length,
      };
    });
  }
}
