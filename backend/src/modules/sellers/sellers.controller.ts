import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Vendedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('sellers')
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vendedores' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.sellersService.findAll(tenantId, pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do vendedor' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sellersService.findOne(tenantId, id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Criar vendedor' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateSellerDto,
  ) {
    return this.sellersService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Atualizar vendedor' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSellerDto,
  ) {
    return this.sellersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Inativar vendedor' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sellersService.remove(tenantId, id);
  }
}
