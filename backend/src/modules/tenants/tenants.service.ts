import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        document: true,
        slug: true,
        settings: true,
        status: true,
        plan: {
          select: { name: true, maxUsers: true, maxPolicies: true },
        },
        createdAt: true,
      },
    });

    if (!tenant) throw new NotFoundException('Tenant nao encontrado');

    // Parse settings JSON string
    const settings = tenant.settings ? JSON.parse(tenant.settings) : {};
    return { ...tenant, settings };
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant nao encontrado');

    const currentSettings = tenant.settings ? JSON.parse(tenant.settings) : {};

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name ?? tenant.name,
        document: dto.document ?? tenant.document,
        settings: JSON.stringify({
          ...currentSettings,
          companyPhone: dto.phone ?? currentSettings.companyPhone,
          companyEmail: dto.email ?? currentSettings.companyEmail,
        }),
      },
      select: {
        id: true,
        name: true,
        document: true,
        slug: true,
        settings: true,
        status: true,
      },
    });
  }
}
