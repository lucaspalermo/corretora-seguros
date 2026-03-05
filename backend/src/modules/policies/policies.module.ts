import { Module } from '@nestjs/common';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { RenewalService } from './renewal.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PoliciesController],
  providers: [PoliciesService, RenewalService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
