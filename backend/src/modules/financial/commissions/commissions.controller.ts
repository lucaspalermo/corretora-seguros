import {
  Controller, Get, Patch, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Financeiro - Comissoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comissoes' })
  @ApiQuery({ name: 'sellerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('sellerId') sellerId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.commissionsService.findAll(tenantId, pagination, {
      sellerId, status, dateFrom, dateTo,
    });
  }

  @Get('summary')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Resumo de comissoes por vendedor' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async summary(
    @CurrentUser('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.commissionsService.getSummaryBySeller(tenantId, dateFrom, dateTo);
  }

  @Patch(':id/pay')
  @Roles('admin', 'financial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar comissao como paga' })
  async markAsPaid(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commissionsService.markAsPaid(tenantId, id);
  }
}
