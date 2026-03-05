import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      activePolicies,
      policiesByCategory,
      monthlyDue,
      monthlyReceived,
      overdueCount,
      totalClients,
    ] = await Promise.all([
      // Total de apolices ativas
      this.prisma.policy.count({
        where: { tenantId, type: { in: ['active', 'lifetime'] } },
      }),

      // Total por categoria
      this.prisma.policy.groupBy({
        by: ['category'],
        where: { tenantId, type: { in: ['active', 'lifetime'] } },
        _count: true,
      }),

      // Total a receber no mes
      this.prisma.receivable.aggregate({
        where: {
          tenantId,
          dueDate: { gte: firstDayOfMonth, lte: lastDayOfMonth },
          status: { in: ['pending', 'overdue'] },
        },
        _sum: { grossAmountCents: true },
      }),

      // Total recebido no mes
      this.prisma.receivable.aggregate({
        where: {
          tenantId,
          receivedDate: { gte: firstDayOfMonth, lte: lastDayOfMonth },
          status: 'received',
        },
        _sum: { grossAmountCents: true, brokerCommissionCents: true, sellerCommissionCents: true },
      }),

      // Inadimplencia
      this.prisma.receivable.count({
        where: { tenantId, status: 'overdue' },
      }),

      // Total clientes
      this.prisma.client.count({
        where: { tenantId, status: 'active' },
      }),
    ]);

    return {
      activePolicies,
      totalClients,
      overdueCount,
      policiesByCategory: policiesByCategory.map((g) => ({
        category: g.category,
        count: g._count,
      })),
      monthlyDueCents: monthlyDue._sum.grossAmountCents || 0,
      monthlyReceivedCents: monthlyReceived._sum.grossAmountCents || 0,
      monthlyBrokerCommissionCents: monthlyReceived._sum.brokerCommissionCents || 0,
      monthlySellerCommissionCents: monthlyReceived._sum.sellerCommissionCents || 0,
    };
  }

  async getSellerRanking(tenantId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sellers = await this.prisma.seller.findMany({
      where: { tenantId, status: 'active' },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            policies: { where: { type: { in: ['active', 'lifetime'] } } },
          },
        },
        commissionPayments: {
          where: { createdAt: { gte: firstDayOfMonth } },
          select: { amountCents: true, status: true },
        },
      },
    });

    return sellers
      .map((s) => ({
        id: s.id,
        name: s.name,
        activePolicies: s._count.policies,
        monthlyCommissionCents: s.commissionPayments.reduce(
          (acc, c) => acc + c.amountCents,
          0,
        ),
      }))
      .sort((a, b) => b.activePolicies - a.activePolicies);
  }
}
