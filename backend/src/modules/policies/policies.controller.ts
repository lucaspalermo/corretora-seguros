import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { RenewalService } from './renewal.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { RenewPolicyDto } from './dto/renew-policy.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Apolices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('policies')
export class PoliciesController {
  constructor(
    private policiesService: PoliciesService,
    private renewalService: RenewalService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar apolices' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'sellerId', required: false })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.policiesService.findAll(tenantId, pagination, {
      search, category, type, sellerId,
    });
  }

  @Get('renewals/upcoming')
  @ApiOperation({ summary: 'Apolices proximas do vencimento (30 dias)' })
  async getUpcomingRenewals(
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.renewalService.getUpcomingRenewals(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da apolice com parcelas' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.policiesService.findOne(tenantId, id);
  }

  @Post()
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Criar apolice (gera parcelas automaticamente)' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policiesService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Atualizar apolice' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policiesService.update(tenantId, id, dto);
  }

  @Post(':id/renew')
  @Roles('admin', 'financial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar apolice manualmente' })
  async renew(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenewPolicyDto,
  ) {
    return this.renewalService.manualRenew(tenantId, id, dto);
  }

  @Post(':id/cancel')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar apolice (cancela parcelas pendentes)' })
  async cancel(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.policiesService.cancel(tenantId, id);
  }
}
