import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Importacao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('clients')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importar clientes via CSV/Excel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        // Aceita tambem por extensao
        if (
          allowed.includes(file.mimetype) ||
          /\.(csv|xlsx|xls)$/i.test(file.originalname)
        ) {
          cb(null, true);
        } else {
          cb(new Error('Apenas CSV e Excel sao aceitos'), false);
        }
      },
    }),
  )
  async importClients(
    @CurrentUser('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('Arquivo nao enviado');
    return this.importService.importClients(tenantId, file.buffer, file.mimetype);
  }

  @Post('policies')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importar apolices via CSV/Excel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (
          allowed.includes(file.mimetype) ||
          /\.(csv|xlsx|xls)$/i.test(file.originalname)
        ) {
          cb(null, true);
        } else {
          cb(new Error('Apenas CSV e Excel sao aceitos'), false);
        }
      },
    }),
  )
  async importPolicies(
    @CurrentUser('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('Arquivo nao enviado');
    return this.importService.importPolicies(
      tenantId,
      file.buffer,
      file.mimetype,
    );
  }

  @Get('templates/clients')
  @ApiOperation({ summary: 'Download template CSV de clientes' })
  async getClientsTemplate(@Res() res: Response) {
    const csv = this.importService.getClientsTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=template_clientes.csv',
    );
    res.send(csv);
  }

  @Get('templates/policies')
  @ApiOperation({ summary: 'Download template CSV de apolices' })
  async getPoliciesTemplate(@Res() res: Response) {
    const csv = this.importService.getPoliciesTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=template_apolices.csv',
    );
    res.send(csv);
  }
}
