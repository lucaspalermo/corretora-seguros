import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Jobs module desabilitado quando Redis nao esta disponivel (dev com SQLite)
// Para habilitar, configure REDIS_HOST no .env e descomente as importacoes abaixo
// import { BullModule } from '@nestjs/bullmq';
// import { OverdueCheckProcessor } from './overdue-check.processor';
// import { RenewalCheckProcessor } from './renewal-check.processor';
// import { JobSchedulerService } from './job-scheduler.service';

@Module({
  // Quando Redis estiver disponivel, reabilite:
  // imports: [
  //   BullModule.forRootAsync({
  //     inject: [ConfigService],
  //     useFactory: (config: ConfigService) => ({
  //       connection: {
  //         host: config.get('REDIS_HOST', 'localhost'),
  //         port: config.get('REDIS_PORT', 6379),
  //       },
  //     }),
  //   }),
  //   BullModule.registerQueue(
  //     { name: 'overdue-check' },
  //     { name: 'renewal-check' },
  //   ),
  // ],
  // providers: [OverdueCheckProcessor, RenewalCheckProcessor, JobSchedulerService],
})
export class JobsModule {
  private readonly logger = new Logger(JobsModule.name);

  onModuleInit() {
    this.logger.warn('Jobs module desabilitado (Redis nao configurado). Jobs de inadimplencia e renovacao nao serao executados automaticamente.');
  }
}
