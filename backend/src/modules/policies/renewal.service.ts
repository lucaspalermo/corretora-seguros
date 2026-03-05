import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RenewalService {
  private readonly logger = new Logger(RenewalService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Run every day at 8am
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkRenewals() {
    this.logger.log('Verificando apolices para renovacao...');

    const now = new Date();
    const in30days = new Date();
    in30days.setDate(now.getDate() + 30);
    const in15days = new Date();
    in15days.setDate(now.getDate() + 15);
    const in7days = new Date();
    in7days.setDate(now.getDate() + 7);

    // Find policies expiring in 30, 15, 7 days
    const expiringPolicies = await this.prisma.policy.findMany({
      where: {
        type: 'active',
        endDate: {
          lte: in30days,
          gte: now,
        },
      },
      include: {
        client: { select: { name: true } },
        insurer: { select: { name: true } },
      },
    });

    for (const policy of expiringPolicies) {
      const daysUntilExpiry = Math.ceil(
        (new Date(policy.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Only notify at 30, 15, 7, 1 day marks
      if (![30, 15, 7, 1].includes(daysUntilExpiry)) continue;

      // Get all admin users for this tenant to notify
      const admins = await this.prisma.user.findMany({
        where: {
          tenantId: policy.tenantId,
          role: { in: ['admin', 'financial'] },
          status: 'active',
        },
      });

      for (const admin of admins) {
        // Check if notification already sent today for this policy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await this.prisma.notification.findFirst({
          where: {
            tenantId: policy.tenantId,
            userId: admin.id,
            entity: 'policy',
            entityId: policy.id,
            createdAt: { gte: today },
          },
        });
        if (existing) continue;

        await this.notifications.create(policy.tenantId, {
          userId: admin.id,
          type: 'renewal',
          title: `Apolice ${policy.policyNumber} vence em ${daysUntilExpiry} dias`,
          message: `A apolice de ${policy.client?.name} (${policy.insurer?.name}) vence em ${new Date(policy.endDate!).toLocaleDateString('pt-BR')}. ${policy.autoRenew ? 'Renovacao automatica ativada.' : 'Renovacao automatica desativada.'}`,
          entity: 'policy',
          entityId: policy.id,
        });
      }
    }

    // Auto-renew policies that expired and have autoRenew=true
    const expiredAutoRenew = await this.prisma.policy.findMany({
      where: {
        type: 'active',
        autoRenew: true,
        endDate: {
          lt: now,
          // Only auto-renew recently expired (within last 7 days)
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        insurer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    for (const policy of expiredAutoRenew) {
      try {
        await this.renew(policy.tenantId, policy.id);
        this.logger.log(
          `Apolice ${policy.policyNumber} renovada automaticamente`,
        );
      } catch (err) {
        this.logger.error(
          `Erro ao renovar apolice ${policy.policyNumber}: ${err}`,
        );
      }
    }

    this.logger.log(
      `Verificacao concluida: ${expiringPolicies.length} proximas do vencimento, ${expiredAutoRenew.length} renovadas automaticamente`,
    );
  }

  async renew(tenantId: string, policyId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id: policyId, tenantId },
      include: { client: true, insurer: true, seller: true },
    });
    if (!policy) throw new Error('Apolice nao encontrada');

    return this.prisma.$transaction(async (tx) => {
      // Mark old policy as lifetime (vigencia encerrada)
      await tx.policy.update({
        where: { id: policyId },
        data: { type: 'lifetime', autoRenew: false },
      });

      // Calculate new dates
      const oldEnd = policy.endDate || policy.startDate;
      const newStart = new Date(oldEnd);
      const newEnd = new Date(newStart);
      newEnd.setFullYear(newEnd.getFullYear() + 1);
      const newRenewal = new Date(newEnd);
      newRenewal.setMonth(newRenewal.getMonth() - 1);

      // Generate new policy number
      const year = newStart.getFullYear();
      const newNumber = `${policy.policyNumber}-R${year}`;

      // Create new policy with same terms
      const newPolicy = await tx.policy.create({
        data: {
          tenantId,
          clientId: policy.clientId,
          insurerId: policy.insurerId,
          sellerId: policy.sellerId,
          policyNumber: newNumber,
          category: policy.category,
          type: 'active',
          startDate: newStart,
          endDate: newEnd,
          renewalDate: newRenewal,
          premiumCents: policy.premiumCents,
          paymentMethod: policy.paymentMethod,
          installments: policy.installments,
          brokerCommissionPct: policy.brokerCommissionPct,
          sellerCommissionPct: policy.sellerCommissionPct,
          autoRenew: true,
          notes: `Renovacao automatica da apolice ${policy.policyNumber}`,
        },
      });

      // Generate receivables
      const installmentAmount = Math.floor(
        policy.premiumCents / policy.installments,
      );
      const remainder =
        policy.premiumCents - installmentAmount * policy.installments;

      for (let i = 1; i <= policy.installments; i++) {
        const grossAmount =
          i === 1 ? installmentAmount + remainder : installmentAmount;
        const brokerCommission = Math.round(
          (grossAmount * policy.brokerCommissionPct) / 100,
        );
        const sellerCommission = Math.round(
          (grossAmount * policy.sellerCommissionPct) / 100,
        );
        const netAmount = grossAmount - brokerCommission - sellerCommission;

        const dueDate = new Date(newStart);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        const receivable = await tx.receivable.create({
          data: {
            tenantId,
            policyId: newPolicy.id,
            clientId: policy.clientId,
            installmentNumber: i,
            grossAmountCents: grossAmount,
            brokerCommissionCents: brokerCommission,
            sellerCommissionCents: sellerCommission,
            netAmountCents: netAmount,
            dueDate,
            status: 'pending',
          },
        });

        await tx.commissionPayment.create({
          data: {
            tenantId,
            sellerId: policy.sellerId,
            receivableId: receivable.id,
            amountCents: sellerCommission,
            status: 'pending',
          },
        });
      }

      // Notify admins about the renewal
      const admins = await tx.user.findMany({
        where: {
          tenantId,
          role: { in: ['admin', 'financial'] },
          status: 'active',
        },
      });
      // We can't use notificationsService inside transaction, so create notifications directly
      for (const admin of admins) {
        await tx.notification.create({
          data: {
            tenantId,
            userId: admin.id,
            type: 'renewal',
            title: `Apolice ${policy.policyNumber} renovada`,
            message: `A apolice de ${policy.client?.name} foi renovada automaticamente. Nova apolice: ${newNumber}`,
            entity: 'policy',
            entityId: newPolicy.id,
          },
        });
      }

      return newPolicy;
    });
  }

  // Manual renewal endpoint
  async manualRenew(
    tenantId: string,
    policyId: string,
    overrides?: {
      premiumCents?: number;
      installments?: number;
      paymentMethod?: string;
      brokerCommissionPct?: number;
      sellerCommissionPct?: number;
    },
  ) {
    const policy = await this.prisma.policy.findFirst({
      where: { id: policyId, tenantId },
    });
    if (!policy) throw new Error('Apolice nao encontrada');

    // For manual renewal with overrides, do it inline
    return this.prisma.$transaction(async (tx) => {
      await tx.policy.update({
        where: { id: policyId },
        data: { type: 'lifetime', autoRenew: false },
      });

      const oldEnd = policy.endDate || policy.startDate;
      const newStart = new Date(oldEnd);
      const newEnd = new Date(newStart);
      newEnd.setFullYear(newEnd.getFullYear() + 1);
      const newRenewal = new Date(newEnd);
      newRenewal.setMonth(newRenewal.getMonth() - 1);

      const year = newStart.getFullYear();
      const newNumber = `${policy.policyNumber}-R${year}`;

      const premiumCents = overrides?.premiumCents ?? policy.premiumCents;
      const installments = overrides?.installments ?? policy.installments;
      const paymentMethod = overrides?.paymentMethod ?? policy.paymentMethod;
      const brokerPct =
        overrides?.brokerCommissionPct ?? policy.brokerCommissionPct;
      const sellerPct =
        overrides?.sellerCommissionPct ?? policy.sellerCommissionPct;

      const newPolicy = await tx.policy.create({
        data: {
          tenantId,
          clientId: policy.clientId,
          insurerId: policy.insurerId,
          sellerId: policy.sellerId,
          policyNumber: newNumber,
          category: policy.category,
          type: 'active',
          startDate: newStart,
          endDate: newEnd,
          renewalDate: newRenewal,
          premiumCents,
          paymentMethod,
          installments,
          brokerCommissionPct: brokerPct,
          sellerCommissionPct: sellerPct,
          autoRenew: true,
          notes: `Renovacao manual da apolice ${policy.policyNumber}`,
        },
      });

      const installmentAmount = Math.floor(premiumCents / installments);
      const remainder = premiumCents - installmentAmount * installments;

      for (let i = 1; i <= installments; i++) {
        const grossAmount =
          i === 1 ? installmentAmount + remainder : installmentAmount;
        const brokerCommission = Math.round(
          (grossAmount * brokerPct) / 100,
        );
        const sellerCommission = Math.round(
          (grossAmount * sellerPct) / 100,
        );
        const netAmount = grossAmount - brokerCommission - sellerCommission;

        const dueDate = new Date(newStart);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        const receivable = await tx.receivable.create({
          data: {
            tenantId,
            policyId: newPolicy.id,
            clientId: policy.clientId,
            installmentNumber: i,
            grossAmountCents: grossAmount,
            brokerCommissionCents: brokerCommission,
            sellerCommissionCents: sellerCommission,
            netAmountCents: netAmount,
            dueDate,
            status: 'pending',
          },
        });

        await tx.commissionPayment.create({
          data: {
            tenantId,
            sellerId: policy.sellerId,
            receivableId: receivable.id,
            amountCents: sellerCommission,
            status: 'pending',
          },
        });
      }

      return newPolicy;
    });
  }

  // Get policies approaching renewal
  async getUpcomingRenewals(tenantId: string, daysAhead: number = 30) {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + daysAhead);

    return this.prisma.policy.findMany({
      where: {
        tenantId,
        type: 'active',
        endDate: {
          lte: future,
          gte: now,
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        insurer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }
}
