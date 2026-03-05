import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectQueue('overdue-check') private overdueQueue: Queue,
    @InjectQueue('renewal-check') private renewalQueue: Queue,
  ) {}

  async onModuleInit() {
    // Limpa jobs agendados anteriores
    await this.overdueQueue.obliterate({ force: true }).catch(() => {});
    await this.renewalQueue.obliterate({ force: true }).catch(() => {});

    // Verifica parcelas vencidas todos os dias as 7h
    await this.overdueQueue.add(
      'daily-overdue-check',
      {},
      {
        repeat: { pattern: '0 7 * * *' },
        removeOnComplete: 10,
        removeOnFail: 20,
      },
    );
    this.logger.log('Job agendado: verificacao de parcelas vencidas (diario 7h)');

    // Verifica renovacoes todos os dias as 8h
    await this.renewalQueue.add(
      'daily-renewal-check',
      {},
      {
        repeat: { pattern: '0 8 * * *' },
        removeOnComplete: 10,
        removeOnFail: 20,
      },
    );
    this.logger.log('Job agendado: verificacao de renovacoes (diario 8h)');
  }
}
