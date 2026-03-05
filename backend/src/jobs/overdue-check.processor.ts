import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';

@Injectable()
@Processor('overdue-check')
export class OverdueCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(OverdueCheckProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Verificando parcelas vencidas...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.receivable.updateMany({
      where: {
        status: 'pending',
        dueDate: { lt: today },
      },
      data: {
        status: 'overdue',
      },
    });

    this.logger.log(`${result.count} parcelas marcadas como atrasadas`);

    // Criar notificacoes para parcelas recem atrasadas
    if (result.count > 0) {
      const overdueReceivables = await this.prisma.receivable.findMany({
        where: {
          status: 'overdue',
          dueDate: {
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lt: today,
          },
        },
        include: {
          policy: {
            include: { seller: { include: { user: true } } },
          },
          client: true,
        },
      });

      for (const rec of overdueReceivables) {
        const userId = rec.policy?.seller?.userId;
        if (userId) {
          await this.prisma.notification.create({
            data: {
              tenantId: rec.tenantId,
              userId,
              type: 'overdue',
              title: 'Parcela em atraso',
              message: `Parcela ${rec.installmentNumber} do cliente ${rec.client.name} esta em atraso desde ${rec.dueDate.toLocaleDateString('pt-BR')}.`,
              entity: 'receivable',
              entityId: rec.id,
            },
          });
        }
      }
    }
  }
}
