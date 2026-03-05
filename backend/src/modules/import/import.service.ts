import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  parseFile(buffer: Buffer, mimetype: string): Record<string, string>[] {
    if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
      // Tenta CSV primeiro
      try {
        return parse(buffer, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
        });
      } catch {
        // Fallback para XLSX
      }
    }

    // Parse como Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  async importClients(tenantId: string, buffer: Buffer, mimetype: string) {
    const rows = this.parseFile(buffer, mimetype);
    if (!rows.length) throw new BadRequestException('Arquivo vazio');

    const results = { imported: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // +2 porque header e linha 1

      try {
        const name = row.nome || row.name || row.Nome;
        const document = (
          row.documento ||
          row.document ||
          row.cpf ||
          row.cnpj ||
          row.Documento ||
          row.CPF ||
          row.CNPJ ||
          ''
        ).replace(/\D/g, '');
        const phone = row.telefone || row.phone || row.Telefone || '';
        const email = row.email || row.Email || '';

        if (!name || !document) {
          results.errors.push(
            `Linha ${lineNum}: nome e documento sao obrigatorios`,
          );
          continue;
        }

        const documentType = document.length <= 11 ? 'cpf' : 'cnpj';
        const personType = document.length <= 11 ? 'pf' : 'pj';

        // Verifica se cliente ja existe pelo documento
        const existing = await this.prisma.client.findFirst({
          where: { tenantId, document },
        });
        if (existing) {
          results.errors.push(
            `Linha ${lineNum}: cliente com documento ${document} ja existe`,
          );
          continue;
        }

        await this.prisma.client.create({
          data: {
            tenantId,
            name: name.trim(),
            document,
            documentType,
            personType,
            phone: phone || null,
            email: email || null,
            addressStreet: row.endereco || row.rua || null,
            addressCity: row.cidade || row.city || null,
            addressState: row.estado || row.uf || row.state || null,
            addressZip: (row.cep || row.zip || '').replace(/\D/g, '') || null,
            status: 'active',
          },
        });
        results.imported++;
      } catch (err: any) {
        results.errors.push(
          `Linha ${lineNum}: ${err.message || 'erro desconhecido'}`,
        );
      }
    }

    return results;
  }

  async importPolicies(tenantId: string, buffer: Buffer, mimetype: string) {
    const rows = this.parseFile(buffer, mimetype);
    if (!rows.length) throw new BadRequestException('Arquivo vazio');

    const results = { imported: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2;

      try {
        const policyNumber =
          row.numero || row.policyNumber || row['Numero Apolice'] || '';
        const clientDoc = (
          row.documento_cliente ||
          row.clientDocument ||
          row['CPF/CNPJ Cliente'] ||
          ''
        ).replace(/\D/g, '');
        const insurerName =
          row.operadora || row.insurer || row['Operadora'] || '';
        const sellerName =
          row.vendedor || row.seller || row['Vendedor'] || '';
        const category = row.categoria || row.category || 'other';
        const premiumStr =
          row.premio || row.premium || row['Premio'] || '0';
        const startDateStr =
          row.inicio || row.startDate || row['Data Inicio'] || '';
        const endDateStr =
          row.fim || row.endDate || row['Data Fim'] || '';
        const installmentsStr =
          row.parcelas || row.installments || '1';
        const paymentMethod =
          row.pagamento || row.paymentMethod || 'boleto';
        const brokerPctStr =
          row.comissao_corretora || row.brokerCommission || '0';
        const sellerPctStr =
          row.comissao_vendedor || row.sellerCommission || '0';

        if (!policyNumber || !clientDoc || !insurerName) {
          results.errors.push(
            `Linha ${lineNum}: numero, documento_cliente e operadora sao obrigatorios`,
          );
          continue;
        }

        // Busca cliente pelo documento
        const client = await this.prisma.client.findFirst({
          where: { tenantId, document: clientDoc },
        });
        if (!client) {
          results.errors.push(
            `Linha ${lineNum}: cliente com documento ${clientDoc} nao encontrado`,
          );
          continue;
        }

        // Busca operadora pelo nome
        const insurer = await this.prisma.insurer.findFirst({
          where: { tenantId, name: { contains: insurerName } },
        });
        if (!insurer) {
          results.errors.push(
            `Linha ${lineNum}: operadora "${insurerName}" nao encontrada`,
          );
          continue;
        }

        // Busca vendedor pelo nome (opcional)
        let seller = await this.prisma.seller.findFirst({
          where: { tenantId, status: 'active' },
          orderBy: { createdAt: 'asc' },
        });
        if (sellerName) {
          const foundSeller = await this.prisma.seller.findFirst({
            where: { tenantId, name: { contains: sellerName } },
          });
          if (foundSeller) seller = foundSeller;
        }
        if (!seller) {
          results.errors.push(
            `Linha ${lineNum}: nenhum vendedor encontrado`,
          );
          continue;
        }

        // Parse valores
        const premiumCents = Math.round(
          parseFloat(String(premiumStr).replace(',', '.')) * 100,
        );
        const installments = parseInt(String(installmentsStr)) || 1;
        const brokerPct =
          parseFloat(String(brokerPctStr).replace(',', '.')) || 0;
        const sellerPct =
          parseFloat(String(sellerPctStr).replace(',', '.')) || 0;

        if (isNaN(premiumCents) || premiumCents <= 0) {
          results.errors.push(
            `Linha ${lineNum}: valor do premio invalido`,
          );
          continue;
        }

        // Verifica se apolice ja existe
        const existingPolicy = await this.prisma.policy.findFirst({
          where: { tenantId, policyNumber },
        });
        if (existingPolicy) {
          results.errors.push(
            `Linha ${lineNum}: apolice ${policyNumber} ja existe`,
          );
          continue;
        }

        // Parse datas
        const startDate = this.parseDate(String(startDateStr));
        if (!startDate) {
          results.errors.push(
            `Linha ${lineNum}: data de inicio invalida`,
          );
          continue;
        }

        const endDate = endDateStr ? this.parseDate(String(endDateStr)) : null;

        // Cria apolice com recebiveis
        const policy = await this.prisma.policy.create({
          data: {
            tenantId,
            clientId: client.id,
            insurerId: insurer.id,
            sellerId: seller.id,
            policyNumber,
            category,
            type: 'active',
            startDate,
            endDate,
            premiumCents,
            paymentMethod,
            installments,
            brokerCommissionPct: brokerPct,
            sellerCommissionPct: sellerPct,
          },
        });

        // Gera recebiveis
        const installmentAmount = Math.floor(premiumCents / installments);
        const remainder = premiumCents - installmentAmount * installments;

        for (let j = 1; j <= installments; j++) {
          const grossAmount =
            j === 1 ? installmentAmount + remainder : installmentAmount;
          const brokerCommission = Math.round(
            (grossAmount * brokerPct) / 100,
          );
          const sellerCommission = Math.round(
            (grossAmount * sellerPct) / 100,
          );
          const netAmount = grossAmount - brokerCommission - sellerCommission;

          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + (j - 1));

          const receivable = await this.prisma.receivable.create({
            data: {
              tenantId,
              policyId: policy.id,
              clientId: client.id,
              installmentNumber: j,
              grossAmountCents: grossAmount,
              brokerCommissionCents: brokerCommission,
              sellerCommissionCents: sellerCommission,
              netAmountCents: netAmount,
              dueDate,
              status: 'pending',
            },
          });

          await this.prisma.commissionPayment.create({
            data: {
              tenantId,
              sellerId: seller.id,
              receivableId: receivable.id,
              amountCents: sellerCommission,
              status: 'pending',
            },
          });
        }

        results.imported++;
      } catch (err: any) {
        results.errors.push(
          `Linha ${lineNum}: ${err.message || 'erro desconhecido'}`,
        );
      }
    }

    return results;
  }

  private parseDate(str: string): Date | null {
    if (!str) return null;
    // Tenta DD/MM/YYYY
    const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brMatch)
      return new Date(
        parseInt(brMatch[3]),
        parseInt(brMatch[2]) - 1,
        parseInt(brMatch[1]),
      );
    // Tenta YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch)
      return new Date(
        parseInt(isoMatch[1]),
        parseInt(isoMatch[2]) - 1,
        parseInt(isoMatch[3]),
      );
    // Tenta parse generico
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  getClientsTemplate(): string {
    return 'nome,documento,telefone,email,endereco,cidade,estado,cep\nJoao Silva,12345678900,11999999999,joao@email.com,Rua A 123,Sao Paulo,SP,01001000';
  }

  getPoliciesTemplate(): string {
    return 'numero,documento_cliente,operadora,vendedor,categoria,premio,inicio,fim,parcelas,pagamento,comissao_corretora,comissao_vendedor\nAPO-001,12345678900,Porto Seguro,Carlos,auto,2500.00,01/01/2026,01/01/2027,12,boleto,15,5';
  }
}
