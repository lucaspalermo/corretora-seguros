import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ClientPortalService {
  constructor(private prisma: PrismaService) {}

  // Generate a magic link token for client login
  async generateAccessToken(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });
    if (!client) throw new NotFoundException('Cliente nao encontrado');

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Store token in client metadata (using notes field temporarily)
    // In production, you'd have a separate tokens table
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        notes: JSON.stringify({
          ...(client.notes ? JSON.parse(client.notes || '{}') : {}),
          portalToken: tokenHash,
          portalTokenExpiresAt: expiresAt.toISOString(),
        }),
      },
    });

    return {
      token,
      url: `/portal/${token}`,
      expiresAt,
    };
  }

  // Validate token and return client data
  async validateToken(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Find client with this token
    const clients = await this.prisma.client.findMany({
      where: {
        notes: { contains: tokenHash },
      },
    });

    for (const client of clients) {
      try {
        const meta = JSON.parse(client.notes || '{}');
        if (meta.portalToken === tokenHash) {
          if (new Date(meta.portalTokenExpiresAt) < new Date()) {
            throw new UnauthorizedException('Link expirado');
          }
          return { clientId: client.id, tenantId: client.tenantId };
        }
      } catch (e) {
        if (e instanceof UnauthorizedException) throw e;
        continue;
      }
    }

    throw new UnauthorizedException('Link invalido');
  }

  // Get client portal data
  async getPortalData(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: {
        id: true,
        name: true,
        document: true,
        email: true,
        phone: true,
      },
    });
    if (!client) throw new NotFoundException('Cliente nao encontrado');

    const policies = await this.prisma.policy.findMany({
      where: { tenantId, clientId, type: 'active' },
      include: {
        insurer: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    const receivables = await this.prisma.receivable.findMany({
      where: { tenantId, clientId, status: { in: ['pending', 'overdue'] } },
      include: {
        policy: { select: { policyNumber: true, category: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      client,
      policies: policies.map((p) => ({
        id: p.id,
        policyNumber: p.policyNumber,
        category: p.category,
        insurerName: p.insurer?.name,
        startDate: p.startDate,
        endDate: p.endDate,
        premiumCents: p.premiumCents,
        installments: p.installments,
      })),
      pendingPayments: receivables.map((r) => ({
        id: r.id,
        policyNumber: r.policy?.policyNumber,
        category: r.policy?.category,
        installmentNumber: r.installmentNumber,
        grossAmountCents: r.grossAmountCents,
        dueDate: r.dueDate,
        status: r.status,
      })),
    };
  }
}
