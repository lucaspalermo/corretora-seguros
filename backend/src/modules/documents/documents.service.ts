import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findByEntity(tenantId: string, entity: string, entityId: string) {
    return this.prisma.document.findMany({
      where: { tenantId, entity, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(
    tenantId: string,
    data: {
      entity: string;
      entityId: string;
      file: Express.Multer.File;
      category?: string;
      notes?: string;
      uploadedBy: string;
    },
  ) {
    const url = `/uploads/documents/${data.file.filename}`;

    return this.prisma.document.create({
      data: {
        tenantId,
        entity: data.entity,
        entityId: data.entityId,
        filename: data.file.filename,
        originalName: data.file.originalname,
        mimeType: data.file.mimetype,
        sizeBytes: data.file.size,
        url,
        category: data.category || 'other',
        notes: data.notes || null,
        uploadedBy: data.uploadedBy,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });
    if (!doc) throw new NotFoundException('Documento nao encontrado');

    // Remove arquivo do disco
    const filePath = join(process.cwd(), doc.url.replace(/^\//, ''));
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {}
    }

    await this.prisma.document.delete({ where: { id } });
    return { message: 'Documento removido' };
  }
}
