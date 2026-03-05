'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

const categoryLabels: Record<string, string> = {
  health: 'Saude', auto: 'Auto', life: 'Vida', property: 'Patrimonial',
  travel: 'Viagem', dental: 'Odonto', other: 'Outros',
};

const reportTitles: Record<string, string> = {
  'monthly-receipts': 'Recebimentos Mensais',
  'by-insurer': 'Relatorio por Operadora',
  'by-seller': 'Relatorio por Vendedor',
  'active-policies': 'Apolices Ativas',
  'overdue': 'Inadimplencia',
  'commissions-by-period': 'Comissoes por Periodo',
};

function MonthlyReceiptsReport() {
  const [month, setMonth] = useState(getCurrentMonth());
  const { data, isLoading } = useQuery({
    queryKey: ['report-monthly', month],
    queryFn: () => reportsService.monthlyReceipts(month),
    enabled: !!month,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-sm text-muted-foreground">Mes</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
        </div>
      </div>
      {isLoading ? (
        <div className="animate-pulse"><div className="h-32 bg-muted rounded" /></div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Bruto</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(data.totalGross || 0)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-green-600">{formatCurrency(data.totalReceived || 0)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendente</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-orange-600">{formatCurrency(data.totalPending || 0)}</p></CardContent></Card>
          </div>
          {data.items?.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apolice</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.policyNumber || '-'}</TableCell>
                    <TableCell>{item.clientName || '-'}</TableCell>
                    <TableCell>{item.installmentNumber}</TableCell>
                    <TableCell>{formatCurrency(item.grossAmountCents)}</TableCell>
                    <TableCell>{formatDate(item.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'received' ? 'default' : item.status === 'overdue' ? 'destructive' : 'outline'}>
                        {item.status === 'received' ? 'Recebido' : item.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-center py-8">Selecione um mes para gerar o relatorio</p>
      )}
    </div>
  );
}

function ByInsurerReport() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const { data, isLoading } = useQuery({
    queryKey: ['report-insurer', from, to],
    queryFn: () => reportsService.byInsurer(from, to),
    enabled: !!from && !!to,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-sm text-muted-foreground">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Ate</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </div>
      </div>
      {isLoading ? (
        <div className="animate-pulse"><div className="h-32 bg-muted rounded" /></div>
      ) : data?.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operadora</TableHead>
              <TableHead>Apolices</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Comissao Corretora</TableHead>
              <TableHead>Comissao Vendedores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.insurerId}>
                <TableCell className="font-medium">{row.insurerName}</TableCell>
                <TableCell>{row.policyCount}</TableCell>
                <TableCell>{formatCurrency(row.grossCents)}</TableCell>
                <TableCell>{formatCurrency(row.brokerCommissionCents)}</TableCell>
                <TableCell>{formatCurrency(row.sellerCommissionCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-center py-8">Nenhum dado encontrado para o periodo</p>
      )}
    </div>
  );
}

function BySellerReport() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const { data, isLoading } = useQuery({
    queryKey: ['report-seller', from, to],
    queryFn: () => reportsService.bySeller(from, to),
    enabled: !!from && !!to,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-sm text-muted-foreground">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Ate</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </div>
      </div>
      {isLoading ? (
        <div className="animate-pulse"><div className="h-32 bg-muted rounded" /></div>
      ) : data?.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead>Apolices</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Comissao</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Pendente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.sellerId}>
                <TableCell className="font-medium">{row.sellerName}</TableCell>
                <TableCell>{row.policyCount}</TableCell>
                <TableCell>{formatCurrency(row.grossCents)}</TableCell>
                <TableCell>{formatCurrency(row.commissionCents)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(row.paidCents)}</TableCell>
                <TableCell className="text-orange-600">{formatCurrency(row.pendingCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-center py-8">Nenhum dado encontrado para o periodo</p>
      )}
    </div>
  );
}

function ActivePoliciesReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-active-policies'],
    queryFn: () => reportsService.activePolicies(),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="animate-pulse"><div className="h-32 bg-muted rounded" /></div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de Apolices</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{data.totals?.count || 0}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Premio Total</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(data.totals?.totalPremiumCents || 0)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Por Categoria</CardTitle></CardHeader>
              <CardContent><div className="space-y-1">
                {data.totals?.byCategory && Object.entries(data.totals.byCategory).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span>{categoryLabels[cat] || cat}</span><Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </div></CardContent></Card>
          </div>
          {data.policies?.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Operadora</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Premio</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Vigencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.policies.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.policyNumber}</TableCell>
                    <TableCell>{p.client?.name}</TableCell>
                    <TableCell>{p.insurer?.name}</TableCell>
                    <TableCell><Badge variant="outline">{categoryLabels[p.category] || p.category}</Badge></TableCell>
                    <TableCell>{formatCurrency(p.premiumCents)}</TableCell>
                    <TableCell>{p.seller?.name || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {p.startDate ? formatDate(p.startDate) : '-'} a {p.endDate ? formatDate(p.endDate) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-center py-8">Nenhuma apolice ativa</p>
      )}
    </div>
  );
}

function CommissionsByPeriodReport() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const { data, isLoading } = useQuery({
    queryKey: ['report-commissions-period', from, to],
    queryFn: () => reportsService.commissionsByPeriod(from, to),
    enabled: !!from && !!to,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-sm text-muted-foreground">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Ate</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </div>
      </div>
      {isLoading ? (
        <div className="animate-pulse"><div className="h-32 bg-muted rounded" /></div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Comissoes</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(data.totals?.totalCents || 0)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pago</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-green-600">{formatCurrency(data.totals?.paidCents || 0)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendente</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-orange-600">{formatCurrency(data.totals?.pendingCents || 0)}</p></CardContent></Card>
          </div>
          {data.commissions?.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Apolice</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Pgto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.commissions.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.seller?.name}</TableCell>
                    <TableCell className="font-mono text-sm">{c.receivable?.policy?.policyNumber || '-'}</TableCell>
                    <TableCell>{c.receivable?.policy?.client?.name || '-'}</TableCell>
                    <TableCell>{c.receivable?.installmentNumber}</TableCell>
                    <TableCell>{formatCurrency(c.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'paid' ? 'default' : 'outline'}>
                        {c.status === 'paid' ? 'Pago' : c.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.paidDate ? formatDate(c.paidDate) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-center py-8">Selecione um periodo</p>
      )}
    </div>
  );
}

function OverdueReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-overdue'],
    queryFn: () => reportsService.overdue(),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="animate-pulse"><div className="h-32 bg-muted rounded" /></div>
      ) : data?.length > 0 ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total em Atraso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(data.reduce((acc: number, r: any) => acc + r.grossAmountCents, 0))}
              </p>
              <p className="text-sm text-muted-foreground">{data.length} parcelas</p>
            </CardContent>
          </Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Apolice</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias em Atraso</TableHead>
                <TableHead>Contato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.clientName}</TableCell>
                  <TableCell className="font-mono text-sm">{item.policyNumber || '-'}</TableCell>
                  <TableCell>{item.installmentNumber}</TableCell>
                  <TableCell>{formatCurrency(item.grossAmountCents)}</TableCell>
                  <TableCell>{formatDate(item.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{item.daysOverdue} dias</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.clientPhone || item.clientEmail || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <p className="text-muted-foreground text-center py-8">Nenhuma parcela em atraso</p>
      )}
    </div>
  );
}

export default function ReportViewPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'monthly-receipts';
  const title = reportTitles[type] || 'Relatorio';

  const ReportComponent = useMemo(() => {
    switch (type) {
      case 'monthly-receipts': return MonthlyReceiptsReport;
      case 'by-insurer': return ByInsurerReport;
      case 'by-seller': return BySellerReport;
      case 'active-policies': return ActivePoliciesReport;
      case 'commissions-by-period': return CommissionsByPeriodReport;
      case 'overdue': return OverdueReport;
      default: return MonthlyReceiptsReport;
    }
  }, [type]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <ReportComponent />
    </div>
  );
}
