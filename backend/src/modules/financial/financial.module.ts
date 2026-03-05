import { Module } from '@nestjs/common';
import { ReceivablesController } from './receivables/receivables.controller';
import { ReceivablesService } from './receivables/receivables.service';
import { CommissionsController } from './commissions/commissions.controller';
import { CommissionsService } from './commissions/commissions.service';

@Module({
  controllers: [ReceivablesController, CommissionsController],
  providers: [ReceivablesService, CommissionsService],
  exports: [ReceivablesService, CommissionsService],
})
export class FinancialModule {}
