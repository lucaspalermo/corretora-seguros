import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';
import { ConvertToPolicyDto } from './dto/convert-to-policy.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Multicalculo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cotacoes' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.quotesService.findAll(tenantId, pagination, { search, status, category, clientId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da cotacao com items' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.findOne(tenantId, id);
  }

  @Post()
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Criar cotacao' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Atualizar cotacao' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateQuoteDto>,
  ) {
    return this.quotesService.update(tenantId, id, dto);
  }

  @Post(':id/items')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Adicionar cotacao de seguradora' })
  async addItem(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateQuoteItemDto,
  ) {
    return this.quotesService.addItem(tenantId, id, dto);
  }

  @Patch(':id/items/:itemId')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Atualizar cotacao de seguradora' })
  async updateItem(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: Partial<CreateQuoteItemDto>,
  ) {
    return this.quotesService.updateItem(tenantId, id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Remover cotacao de seguradora' })
  async removeItem(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.quotesService.removeItem(tenantId, id, itemId);
  }

  @Post(':id/items/:itemId/select')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Selecionar cotacao vencedora' })
  async selectItem(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.quotesService.selectItem(tenantId, id, itemId);
  }

  @Post(':id/convert')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Converter cotacao em apolice' })
  async convertToPolicy(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertToPolicyDto,
  ) {
    return this.quotesService.convertToPolicy(tenantId, id, dto);
  }

  @Post(':id/duplicate')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Duplicar cotacao' })
  async duplicate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.duplicate(tenantId, id);
  }
}
