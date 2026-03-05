import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelExporter {
  async generateReceivablesReport(data: any[], title: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SeguraSaaS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title);

    // Header styling
    sheet.columns = [
      { header: 'Apolice', key: 'policyNumber', width: 20 },
      { header: 'Cliente', key: 'clientName', width: 30 },
      { header: 'Parcela', key: 'installment', width: 10 },
      { header: 'Valor Bruto', key: 'grossAmount', width: 15 },
      { header: 'Comissao Corretora', key: 'brokerComm', width: 18 },
      { header: 'Comissao Vendedor', key: 'sellerComm', width: 18 },
      { header: 'Valor Liquido', key: 'netAmount', width: 15 },
      { header: 'Vencimento', key: 'dueDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, size: 11 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    // Add data rows
    for (const item of data) {
      sheet.addRow({
        policyNumber: item.policyNumber || '-',
        clientName: item.clientName || '-',
        installment: item.installmentNumber,
        grossAmount: (item.grossAmountCents || 0) / 100,
        brokerComm: (item.brokerCommissionCents || 0) / 100,
        sellerComm: (item.sellerCommissionCents || 0) / 100,
        netAmount: (item.netAmountCents || 0) / 100,
        dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString('pt-BR') : '-',
        status: this.translateStatus(item.status),
      });
    }

    // Format currency columns
    ['D', 'E', 'F', 'G'].forEach((col) => {
      sheet.getColumn(col).numFmt = '#,##0.00';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateCommissionsReport(data: any[], title: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SeguraSaaS';

    const sheet = workbook.addWorksheet(title);

    sheet.columns = [
      { header: 'Vendedor', key: 'sellerName', width: 25 },
      { header: 'Apolice', key: 'policyNumber', width: 20 },
      { header: 'Parcela', key: 'installment', width: 10 },
      { header: 'Valor Comissao', key: 'amount', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Data Pagamento', key: 'paidDate', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };

    for (const item of data) {
      sheet.addRow({
        sellerName: item.sellerName || item.seller?.name || '-',
        policyNumber: item.policyNumber || item.receivable?.policy?.policyNumber || '-',
        installment: item.receivable?.installmentNumber || '-',
        amount: (item.amountCents || 0) / 100,
        status: item.status === 'paid' ? 'Pago' : 'Pendente',
        paidDate: item.paidDate ? new Date(item.paidDate).toLocaleDateString('pt-BR') : '-',
      });
    }

    sheet.getColumn('D').numFmt = '#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Em Aberto',
      received: 'Recebido',
      overdue: 'Atrasado',
      cancelled: 'Cancelado',
      paid: 'Pago',
    };
    return map[status] || status;
  }
}
