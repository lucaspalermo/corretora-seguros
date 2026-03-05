import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { InsurersModule } from './modules/insurers/insurers.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { HealthModule } from './health/health.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ImportModule } from './modules/import/import.module';
import { ClientPortalModule } from './modules/client-portal/client-portal.module';
import { EmailModule } from './modules/email/email.module';
import { JobsModule } from './jobs/jobs.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ClientsModule,
    InsurersModule,
    SellersModule,
    PoliciesModule,
    FinancialModule,
    DashboardModule,
    ReportsModule,
    AuditModule,
    UsersModule,
    NotificationsModule,
    TenantsModule,
    QuotesModule,
    DocumentsModule,
    ImportModule,
    ClientPortalModule,
    EmailModule,
    HealthModule,
    JobsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
