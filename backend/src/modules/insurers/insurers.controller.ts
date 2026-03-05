import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InsurersService } from './insurers.service';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Operadoras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('insurers')
export class InsurersController {
  constructor(private insurersService: InsurersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar operadoras' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.insurersService.findAll(tenantId, pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da operadora' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.insurersService.findOne(tenantId, id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Criar operadora' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateInsurerDto,
  ) {
    return this.insurersService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Atualizar operadora' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsurerDto,
  ) {
    return this.insurersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Inativar operadora' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.insurersService.remove(tenantId, id);
  }
}
