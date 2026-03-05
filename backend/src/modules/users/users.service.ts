import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, search?: string) {
    const { query, limit } = buildPaginationQuery(pagination);

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        ...query,
        where,
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        seller: { select: { id: true, name: true } },
      },
    });

    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return user;
  }

  async create(tenantId: string, dto: { name: string; email: string; password: string; role?: string; cpf?: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });

    if (existing) throw new ConflictException('Email ja cadastrado neste tenant');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        cpf: dto.cpf,
        role: (dto.role as any) || 'viewer',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(tenantId: string, id: string, dto: { name?: string; email?: string; role?: string; status?: string; password?: string }) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Usuario nao encontrado');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email ja em uso');
    }

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email;
    if (dto.role) data.role = dto.role;
    if (dto.status) data.status = dto.status;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Usuario nao encontrado');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
      select: { id: true, status: true },
    });
  }
}
