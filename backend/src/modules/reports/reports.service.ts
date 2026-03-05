import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async monthlyReceipts(tenantId: string, month: string) {
    // month formato: "2026-03"
    const [year, m] = month.split('-').map(Number);
    const from = new Date(year, m - 1, 1);
    const to = new Date(year, m, 0);

    const receivables = await this.prisma.receivable.findMany({
      where: {
        tenantId,
        dueDate: { gte: from, lte: to },
      },
      include: {
        client: { select: { name: true, document: true } },
        policy: { select: { policyNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totals = receivables.reduce(
      (acc, r) => ({
        grossCents: acc.grossCents + r.grossAmountCents,
        brokerCents: acc.brokerCents + r.brokerCommissionCents,
        sellerCents: acc.sellerCents + r.sellerCommissionCents,
        netCents: acc.netCents + r.netAmountCents,
        received: acc.received + (r.status === 'received' ? r.grossAmountCents : 0),
        pending: acc.pending + (r.status === 'pending' ? r.grossAmountCents : 0),
        overdue: acc.overdue + (r.status === 'overdue' ? r.grossAmountCents : 0),
      }),
      { grossCents: 0, brokerCents: 0, sellerCents: 0, netCents: 0, received: 0, pending: 0, overdue: 0 },
    );

    return { month, receivables, totals, count: receivables.length };
  }

  async byInsurer(tenantId: string, from: string, to: string) {
    const receivables = await this.prisma.receivable.findMany({
      where: {
        tenantId,
        dueDate: { gte: new Date(from), lte: new Date(to) },
      },
      include: {
        policy: {
          select: {
            insurer: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    const grouped = new Map<string, { name: string; category: string; grossCents: number; count: number }>();
    for (const r of receivables) {
      const insurer = r.policy.insurer;
      const existing = grouped.get(insurer.id) || {
        name: insurer.name,
        category: insurer.category,
        grossCents: 0,
        count: 0,
      };
      existing.grossCents += r.grossAmountCents;
      existing.count += 1;
      grouped.set(insurer.id, existing);
    }

    return Array.from(grouped.entries()).map(([id, data]) => ({
      insurerId: id,
      ...data,
    }));
  }

  async bySeller(tenantId: string, from: string, to: string) {
    const commissions = await this.prisma.commissionPayment.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(from), lte: new Date(to) },
      },
      include: {
        seller: { select: { id: true, name: true } },
      },
    });

    const grouped = new Map<string, { name: string; totalCents: number; paidCents: number; pendingCents: number; count: number }>();
    for (const c of commissions) {
      const existing = grouped.get(c.seller.id) || {
        name: c.seller.name,
        totalCents: 0,
        paidCents: 0,
        pendingCents: 0,
        count: 0,
      };
      existing.totalCents += c.amountCents;
      if (c.status === 'paid') existing.paidCents += c.amountCents;
      else if (c.status === 'pending') existing.pendingCents += c.amountCents;
      existing.count += 1;
      grouped.set(c.seller.id, existing);
    }

    return Array.from(grouped.entries()).map(([id, data]) => ({
      sellerId: id,
      ...data,
    }));
  }

  async activePolicies(tenantId: string) {
    const policies = await this.prisma.policy.findMany({
      where: { tenantId, type: { in: ['active', 'lifetime'] } },
      include: {
        client: { select: { name: true, document: true } },
        insurer: { select: { name: true, category: true } },
        seller: { select: { name: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    const byCategory = new Map<string, number>();
    let totalPremium = 0;
    for (const p of policies) {
      byCategory.set(p.category, (byCategory.get(p.category) || 0) + 1);
      totalPremium += p.premiumCents;
    }

    return {
      policies,
      totals: {
        count: policies.length,
        totalPremiumCents: totalPremium,
        byCategory: Object.fromEntries(byCategory),
      },
    };
  }

  async commissionsByPeriod(tenantId: string, from: string, to: string) {
    const commissions = await this.prisma.commissionPayment.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(from), lte: new Date(to) },
      },
      include: {
        seller: { select: { id: true, name: true } },
        receivable: {
          select: {
            installmentNumber: true,
            dueDate: true,
            policy: { select: { policyNumber: true, client: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalCents = 0;
    let paidCents = 0;
    let pendingCents = 0;
    for (const c of commissions) {
      totalCents += c.amountCents;
      if (c.status === 'paid') paidCents += c.amountCents;
      else if (c.status === 'pending') pendingCents += c.amountCents;
    }

    return {
      commissions,
      totals: { totalCents, paidCents, pendingCents, count: commissions.length },
    };
  }

  async overdue(tenantId: string) {
    return this.prisma.receivable.findMany({
      where: { tenantId, status: 'overdue' },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        policy: { select: { policyNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
