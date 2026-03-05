import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';

@Injectable()
@Processor('renewal-check')
export class RenewalCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(RenewalCheckProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Verificando apolices para renovacao...');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar apolices que vencem nos proximos 30 dias
    const expiringPolicies = await this.prisma.policy.findMany({
      where: {
        type: 'active',
        renewalDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        client: true,
        insurer: true,
        seller: { include: { user: true } },
      },
    });

    this.logger.log(`${expiringPolicies.length} apolices proximas da renovacao`);

    for (const policy of expiringPolicies) {
      const daysUntilRenewal = Math.ceil(
        (policy.renewalDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Notificar apenas em marcos: 30, 15, 7, 3, 1 dias
      if (![30, 15, 7, 3, 1].includes(daysUntilRenewal)) continue;

      // Notificar vendedor
      if (policy.seller?.userId) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: policy.seller.userId,
            entity: 'policy',
            entityId: policy.id,
            type: 'renewal',
            createdAt: { gte: new Date(today.getTime() - 12 * 60 * 60 * 1000) },
          },
        });

        if (!existing) {
          await this.prisma.notification.create({
            data: {
              tenantId: policy.tenantId,
              userId: policy.seller.userId,
              type: 'renewal',
              title: 'Renovacao de apolice',
              message: `A apolice ${policy.policyNumber} do cliente ${policy.client.name} renova em ${daysUntilRenewal} dia(s).`,
              entity: 'policy',
              entityId: policy.id,
            },
          });
        }
      }
    }
  }
}
