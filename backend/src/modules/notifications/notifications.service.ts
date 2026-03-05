import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, userId: string, pagination: PaginationDto, unreadOnly?: boolean) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId, userId };
    if (unreadOnly) where.read = false;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { tenantId, userId, read: false },
    });
    return { count };
  }

  async markAsRead(tenantId: string, userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId, userId },
    });
    if (!notification) throw new NotFoundException('Notificacao nao encontrada');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async create(tenantId: string, data: {
    userId: string;
    type: 'renewal' | 'overdue' | 'system' | 'report';
    title: string;
    message: string;
    entity?: string;
    entityId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        entity: data.entity,
        entityId: data.entityId,
      },
    });
  }
}
