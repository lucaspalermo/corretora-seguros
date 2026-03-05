import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID as uuid } from 'crypto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
const uploadsDir = join(baseDir, 'uploads', 'documents');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar documentos de uma entidade' })
  async findByEntity(
    @CurrentUser('tenantId') tenantId: string,
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
  ) {
    return this.documentsService.findByEntity(tenantId, entity, entityId);
  }

  @Post()
  @ApiOperation({ summary: 'Upload de documento' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => {
          const uniqueName = `${uuid()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(pdf|png|jpg|jpeg|doc|docx|xls|xlsx)$/i;
        if (allowed.test(file.originalname)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de arquivo nao permitido'), false);
        }
      },
    }),
  )
  async upload(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('entity') entity: string,
    @Body('entityId') entityId: string,
    @Body('category') category?: string,
    @Body('notes') notes?: string,
  ) {
    return this.documentsService.upload(tenantId, {
      entity,
      entityId,
      file,
      category,
      notes,
      uploadedBy: userId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover documento' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.remove(tenantId, id);
  }
}
