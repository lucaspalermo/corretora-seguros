import {
  Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientPortalService } from './client-portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Portal do Cliente')
@Controller('client-portal')
export class ClientPortalController {
  constructor(private portalService: ClientPortalService) {}

  // Admin generates a link for the client
  @Post('generate/:clientId')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('admin', 'financial')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar link de acesso para cliente' })
  async generateLink(
    @CurrentUser('tenantId') tenantId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.portalService.generateAccessToken(tenantId, clientId);
  }

  // Public endpoint - client accesses their portal
  @Get('access/:token')
  @ApiOperation({ summary: 'Acessar portal do cliente (link publico)' })
  async accessPortal(@Param('token') token: string) {
    const { clientId, tenantId } = await this.portalService.validateToken(token);
    return this.portalService.getPortalData(tenantId, clientId);
  }
}
