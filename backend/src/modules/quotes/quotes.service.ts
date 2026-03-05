import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';
import { ConvertToPolicyDto } from './dto/convert-to-policy.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto, filters?: {
    search?: string; status?: string; category?: string; clientId?: string;
  }) {
    const { query, limit } = buildPaginationQuery(pagination);
    const where: any = { tenantId };

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { client: { name: { contains: filters.search } } },
      ];
    }
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.clientId) where.clientId = filters.clientId;

    const [items, total] = await Promise.all([
      this.prisma.quote.findMany({
        ...query,
        where,
        include: {
          client: { select: { id: true, name: true, document: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return buildPaginatedResult(items, limit, total);
  }

  async findOne(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        items: {
          include: { insurer: { select: { id: true, name: true, category: true } } },
          orderBy: { premiumCents: 'asc' },
        },
      },
    });
    if (!quote) throw new NotFoundException('Cotacao nao encontrada');
    return quote;
  }

  async create(tenantId: string, dto: CreateQuoteDto) {
    // Validar JSON
    try { JSON.parse(dto.riskData); } catch { throw new BadRequestException('riskData deve ser JSON valido'); }

    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, tenantId } });
    if (!client) throw new NotFoundException('Cliente nao encontrado');

    const categoryLabels: Record<string, string> = {
      auto: 'Auto', health: 'Saude', life: 'Vida', property: 'Residencial',
      business: 'Empresarial', dental: 'Odonto', travel: 'Viagem', other: 'Outros',
    };
    const catLabel = categoryLabels[dto.category] || dto.category;
    const title = dto.title || `Cotacao ${catLabel} - ${client.name}`;

    return this.prisma.quote.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        sellerId: dto.sellerId,
        title,
        category: dto.category,
        riskData: dto.riskData,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        notes: dto.notes,
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateQuoteDto>) {
    await this.findOne(tenantId, id);
    const data: any = {};
    if (dto.title) data.title = dto.title;
    if (dto.riskData) {
      try { JSON.parse(dto.riskData); } catch { throw new BadRequestException('riskData deve ser JSON valido'); }
      data.riskData = dto.riskData;
    }
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);

    return this.prisma.quote.update({ where: { id }, data });
  }

  async addItem(tenantId: string, quoteId: string, dto: CreateQuoteItemDto) {
    const quote = await this.findOne(tenantId, quoteId);
    if (quote.status === 'accepted' || quote.status === 'cancelled') {
      throw new BadRequestException('Nao e possivel adicionar items a cotacao com status ' + quote.status);
    }

    const insurer = await this.prisma.insurer.findFirst({ where: { id: dto.insurerId, tenantId, status: 'active' } });
    if (!insurer) throw new NotFoundException('Operadora nao encontrada');

    if (dto.coverages) { try { JSON.parse(dto.coverages); } catch { throw new BadRequestException('coverages deve ser JSON valido'); } }
    if (dto.conditions) { try { JSON.parse(dto.conditions); } catch { throw new BadRequestException('conditions deve ser JSON valido'); } }

    return this.prisma.quoteItem.create({
      data: {
        tenantId,
        quoteId,
        insurerId: dto.insurerId,
        premiumCents: dto.premiumCents,
        installments: dto.installments || 1,
        paymentMethod: dto.paymentMethod,
        brokerCommissionPct: dto.brokerCommissionPct,
        sellerCommissionPct: dto.sellerCommissionPct || 0,
        coverages: dto.coverages || '{}',
        conditions: dto.conditions || '{}',
        proposalNumber: dto.proposalNumber,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes,
      },
      include: { insurer: { select: { id: true, name: true } } },
    });
  }

  async updateItem(tenantId: string, quoteId: string, itemId: string, dto: Partial<CreateQuoteItemDto>) {
    const item = await this.prisma.quoteItem.findFirst({ where: { id: itemId, quoteId, tenantId } });
    if (!item) throw new NotFoundException('Item nao encontrado');

    const data: any = { ...dto };
    if (dto.coverages) { try { JSON.parse(dto.coverages); } catch { throw new BadRequestException('coverages deve ser JSON valido'); } }
    if (dto.conditions) { try { JSON.parse(dto.conditions); } catch { throw new BadRequestException('conditions deve ser JSON valido'); } }
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);
    delete data.insurerId; // nao pode mudar a seguradora

    return this.prisma.quoteItem.update({
      where: { id: itemId },
      data,
      include: { insurer: { select: { id: true, name: true } } },
    });
  }

  async removeItem(tenantId: string, quoteId: string, itemId: string) {
    const item = await this.prisma.quoteItem.findFirst({ where: { id: itemId, quoteId, tenantId } });
    if (!item) throw new NotFoundException('Item nao encontrado');
    await this.prisma.quoteItem.delete({ where: { id: itemId } });
    return { message: 'Item removido' };
  }

  async selectItem(tenantId: string, quoteId: string, itemId: string) {
    const quote = await this.findOne(tenantId, quoteId);
    const item = quote.items.find(i => i.id === itemId);
    if (!item) throw new NotFoundException('Item nao encontrado');

    await this.prisma.$transaction([
      this.prisma.quoteItem.updateMany({ where: { quoteId }, data: { selected: false } }),
      this.prisma.quoteItem.update({ where: { id: itemId }, data: { selected: true } }),
      this.prisma.quote.update({ where: { id: quoteId }, data: { acceptedItemId: itemId } }),
    ]);

    return this.findOne(tenantId, quoteId);
  }

  async convertToPolicy(tenantId: string, quoteId: string, dto: ConvertToPolicyDto) {
    const quote = await this.findOne(tenantId, quoteId);
    const selectedItem = quote.items.find(i => i.selected);
    if (!selectedItem) throw new BadRequestException('Selecione um item antes de converter');

    return this.prisma.$transaction(async (tx) => {
      // Criar a apolice
      const policy = await tx.policy.create({
        data: {
          tenantId,
          clientId: quote.clientId,
          insurerId: selectedItem.insurerId,
          sellerId: quote.sellerId,
          policyNumber: dto.policyNumber,
          category: quote.category,
          type: 'active',
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
          premiumCents: selectedItem.premiumCents,
          paymentMethod: dto.paymentMethod,
          installments: selectedItem.installments,
          brokerCommissionPct: selectedItem.brokerCommissionPct,
          sellerCommissionPct: selectedItem.sellerCommissionPct,
          autoRenew: dto.autoRenew || false,
          metadata: JSON.stringify({ quoteId: quote.id, quoteItemId: selectedItem.id }),
        },
      });

      // Gerar parcelas
      const installmentAmount = Math.floor(selectedItem.premiumCents / selectedItem.installments);
      const remainder = selectedItem.premiumCents - (installmentAmount * selectedItem.installments);

      for (let i = 1; i <= selectedItem.installments; i++) {
        const grossAmount = i === 1 ? installmentAmount + remainder : installmentAmount;
        const brokerComm = Math.round(grossAmount * selectedItem.brokerCommissionPct / 100);
        const sellerComm = Math.round(grossAmount * selectedItem.sellerCommissionPct / 100);

        const dueDate = new Date(dto.startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        const receivable = await tx.receivable.create({
          data: {
            tenantId,
            policyId: policy.id,
            clientId: quote.clientId,
            installmentNumber: i,
            grossAmountCents: grossAmount,
            brokerCommissionCents: brokerComm,
            sellerCommissionCents: sellerComm,
            netAmountCents: grossAmount - brokerComm - sellerComm,
            dueDate,
            status: 'pending',
          },
        });

        await tx.commissionPayment.create({
          data: {
            tenantId,
            sellerId: quote.sellerId,
            receivableId: receivable.id,
            amountCents: sellerComm,
            status: 'pending',
          },
        });
      }

      // Atualizar cotacao
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'accepted', acceptedAt: new Date(), policyId: policy.id },
      });

      return policy;
    });
  }

  async duplicate(tenantId: string, quoteId: string) {
    const quote = await this.findOne(tenantId, quoteId);

    const newQuote = await this.prisma.quote.create({
      data: {
        tenantId,
        clientId: quote.clientId,
        sellerId: quote.sellerId,
        title: `${quote.title} (copia)`,
        category: quote.category,
        riskData: quote.riskData,
        notes: quote.notes,
      },
    });

    for (const item of quote.items) {
      await this.prisma.quoteItem.create({
        data: {
          tenantId,
          quoteId: newQuote.id,
          insurerId: item.insurerId,
          premiumCents: item.premiumCents,
          installments: item.installments,
          paymentMethod: item.paymentMethod,
          brokerCommissionPct: item.brokerCommissionPct,
          sellerCommissionPct: item.sellerCommissionPct,
          coverages: item.coverages,
          conditions: item.conditions,
          proposalNumber: item.proposalNumber,
          notes: item.notes,
        },
      });
    }

    return this.findOne(tenantId, newQuote.id);
  }
}
