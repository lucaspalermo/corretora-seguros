import {
  Controller, Get, Patch, Post, Body, Param, Query,
  UseGuards, ParseUUIDPipe, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID as uuidv4 } from 'crypto';
import { ReceivablesService } from './receivables.service';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Financeiro - Contas a Receber')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('receivables')
export class ReceivablesController {
  constructor(private receivablesService: ReceivablesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar contas a receber' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'policyId', required: false })
  @ApiQuery({ name: 'dueDateFrom', required: false })
  @ApiQuery({ name: 'dueDateTo', required: false })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('policyId') policyId?: string,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
  ) {
    return this.receivablesService.findAll(tenantId, pagination, {
      status, clientId, policyId, dueDateFrom, dueDateTo,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da parcela' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.receivablesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Atualizar parcela (marcar como recebido, editar valor)' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReceivableDto,
  ) {
    return this.receivablesService.update(tenantId, id, dto);
  }

  @Post(':id/upload-proof')
  @Roles('admin', 'financial')
  @ApiOperation({ summary: 'Upload comprovante de pagamento' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.env.VERCEL ? '/tmp' : process.cwd(), 'uploads'),
      filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(pdf|png|jpg|jpeg)$/i;
      if (!allowed.test(extname(file.originalname))) {
        return cb(new BadRequestException('Apenas PDF, PNG, JPG permitidos'), false);
      }
      cb(null, true);
    },
  }))
  async uploadProof(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');
    return this.receivablesService.setPaymentProof(tenantId, id, `/uploads/${file.filename}`);
  }
}
