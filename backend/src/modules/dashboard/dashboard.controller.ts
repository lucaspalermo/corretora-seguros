import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'KPIs do dashboard' })
  async getStats(@CurrentUser('tenantId') tenantId: string) {
    return this.dashboardService.getStats(tenantId);
  }

  @Get('seller-ranking')
  @ApiOperation({ summary: 'Ranking de vendedores' })
  async getSellerRanking(@CurrentUser('tenantId') tenantId: string) {
    return this.dashboardService.getSellerRanking(tenantId);
  }
}
