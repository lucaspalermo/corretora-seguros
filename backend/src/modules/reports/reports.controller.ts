import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Relatorios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin', 'financial')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly-receipts')
  @ApiOperation({ summary: 'Recebimentos mensais' })
  @ApiQuery({ name: 'month', example: '2026-03' })
  async monthlyReceipts(
    @CurrentUser('tenantId') tenantId: string,
    @Query('month') month: string,
  ) {
    return this.reportsService.monthlyReceipts(tenantId, month);
  }

  @Get('by-insurer')
  @ApiOperation({ summary: 'Recebimentos por operadora' })
  @ApiQuery({ name: 'from', example: '2026-01-01' })
  @ApiQuery({ name: 'to', example: '2026-03-31' })
  async byInsurer(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.byInsurer(tenantId, from, to);
  }

  @Get('by-seller')
  @ApiOperation({ summary: 'Comissoes por vendedor' })
  @ApiQuery({ name: 'from', example: '2026-01-01' })
  @ApiQuery({ name: 'to', example: '2026-03-31' })
  async bySeller(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.bySeller(tenantId, from, to);
  }

  @Get('active-policies')
  @ApiOperation({ summary: 'Apolices ativas' })
  async activePolicies(@CurrentUser('tenantId') tenantId: string) {
    return this.reportsService.activePolicies(tenantId);
  }

  @Get('commissions-by-period')
  @ApiOperation({ summary: 'Comissoes por periodo' })
  @ApiQuery({ name: 'from', example: '2026-01-01' })
  @ApiQuery({ name: 'to', example: '2026-03-31' })
  async commissionsByPeriod(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.commissionsByPeriod(tenantId, from, to);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Inadimplencia' })
  async overdue(@CurrentUser('tenantId') tenantId: string) {
    return this.reportsService.overdue(tenantId);
  }
}
