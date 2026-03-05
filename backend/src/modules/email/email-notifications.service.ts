import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class EmailNotificationsService {
  private readonly logger = new Logger(EmailNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  // Send due reminders every day at 9am (3 days before due date)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDueReminders() {
    this.logger.log('Enviando lembretes de vencimento...');

    const in3days = new Date();
    in3days.setDate(in3days.getDate() + 3);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3daysEnd = new Date(in3days);
    in3daysEnd.setHours(23, 59, 59, 999);

    const receivables = await this.prisma.receivable.findMany({
      where: {
        status: 'pending',
        dueDate: {
          gte: today,
          lte: in3daysEnd,
        },
      },
      include: {
        client: { select: { name: true, email: true } },
        policy: {
          select: {
            policyNumber: true,
            tenantId: true,
          },
        },
      },
    });

    let sent = 0;
    for (const rec of receivables) {
      if (!rec.client?.email) continue;

      const tenant = await this.prisma.tenant.findFirst({
        where: { id: rec.policy.tenantId },
      });

      try {
        await this.email.sendDueReminder(rec.client.email, {
          clientName: rec.client.name,
          policyNumber: rec.policy.policyNumber,
          installmentNumber: rec.installmentNumber,
          amount: `R$ ${(rec.grossAmountCents / 100).toFixed(2).replace('.', ',')}`,
          dueDate: new Date(rec.dueDate).toLocaleDateString('pt-BR'),
          brokerName: tenant?.name || 'Corretora',
        });
        sent++;
      } catch (err) {
        this.logger.error(`Erro ao enviar lembrete para ${rec.client.email}: ${err}`);
      }
    }

    this.logger.log(`${sent} lembretes de vencimento enviados`);
  }

  // Send overdue notices every day at 10am
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendOverdueNotices() {
    this.logger.log('Verificando parcelas em atraso...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First, update overdue receivables
    await this.prisma.receivable.updateMany({
      where: {
        status: 'pending',
        dueDate: { lt: today },
      },
      data: { status: 'overdue' },
    });

    // Get overdue receivables that are 1, 7, 15, 30 days overdue
    const overdueReceivables = await this.prisma.receivable.findMany({
      where: {
        status: 'overdue',
      },
      include: {
        client: { select: { name: true, email: true } },
        policy: {
          select: {
            policyNumber: true,
            tenantId: true,
          },
        },
      },
    });

    let sent = 0;
    for (const rec of overdueReceivables) {
      if (!rec.client?.email) continue;

      const daysOverdue = Math.ceil(
        (today.getTime() - new Date(rec.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only send at 1, 7, 15, 30 day marks
      if (![1, 7, 15, 30].includes(daysOverdue)) continue;

      const tenant = await this.prisma.tenant.findFirst({
        where: { id: rec.policy.tenantId },
      });

      try {
        await this.email.sendOverdueNotice(rec.client.email, {
          clientName: rec.client.name,
          policyNumber: rec.policy.policyNumber,
          installmentNumber: rec.installmentNumber,
          amount: `R$ ${(rec.grossAmountCents / 100).toFixed(2).replace('.', ',')}`,
          dueDate: new Date(rec.dueDate).toLocaleDateString('pt-BR'),
          brokerName: tenant?.name || 'Corretora',
        });
        sent++;
      } catch (err) {
        this.logger.error(`Erro ao enviar aviso de atraso para ${rec.client.email}: ${err}`);
      }
    }

    this.logger.log(`${sent} avisos de atraso enviados`);
  }

  // Send renewal reminders (30 days before expiry)
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendRenewalReminders() {
    this.logger.log('Verificando apolices para lembrete de renovacao...');

    const now = new Date();
    const in30days = new Date();
    in30days.setDate(now.getDate() + 30);

    const policies = await this.prisma.policy.findMany({
      where: {
        type: 'active',
        endDate: {
          lte: in30days,
          gte: now,
        },
      },
      include: {
        client: { select: { name: true, email: true } },
        insurer: { select: { name: true } },
      },
    });

    let sent = 0;
    for (const policy of policies) {
      if (!policy.client?.email) continue;

      const daysUntilExpiry = Math.ceil(
        (new Date(policy.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only send at 30, 15, 7 day marks
      if (![30, 15, 7].includes(daysUntilExpiry)) continue;

      const tenant = await this.prisma.tenant.findFirst({
        where: { id: policy.tenantId },
      });

      try {
        await this.email.sendRenewalNotice(policy.client.email, {
          clientName: policy.client.name,
          policyNumber: policy.policyNumber,
          endDate: new Date(policy.endDate!).toLocaleDateString('pt-BR'),
          category: policy.category,
          insurerName: policy.insurer?.name || '-',
          brokerName: tenant?.name || 'Corretora',
        });
        sent++;
      } catch (err) {
        this.logger.error(`Erro ao enviar lembrete de renovacao: ${err}`);
      }
    }

    this.logger.log(`${sent} lembretes de renovacao enviados`);
  }
}
