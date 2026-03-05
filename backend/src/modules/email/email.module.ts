import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EmailService } from './email.service';
import { EmailNotificationsService } from './email-notifications.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [EmailService, EmailNotificationsService],
  exports: [EmailService],
})
export class EmailModule {}
