'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type CommissionPayment, type CommissionSummary } from '@/services/financial.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente', paid: 'Pago', cancelled: 'Cancelado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', paid: 'default', cancelled: 'secondary',
};

export default function CommissionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions', statusFilter, dateFrom, dateTo],
    queryFn: () => financialService.listCommissions({
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
  });

  const { data: summary } = useQuery({
    queryKey: ['commissions-summary', dateFrom, dateTo],
    queryFn: () => financialService.commissionSummary(dateFrom || undefined, dateTo || undefined),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => financialService.payCommission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commissions-summary'] });
    },
  });

  const totalPending = summary?.reduce((acc, s) => acc + s.pendingCents, 0) || 0;
  const totalPaid = summary?.reduce((acc, s) => acc + s.paidCents, 0) || 0;
  const totalAll = summary?.reduce((acc, s) => acc + s.totalCents, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/financial"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Comissoes de Vendedores</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Comissoes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalAll)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {summary && summary.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resumo por Vendedor</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Pendente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((s) => (
                  <TableRow key={s.sellerId}>
                    <TableCell className="font-medium">{s.sellerName}</TableCell>
                    <TableCell>{s.count}</TableCell>
                    <TableCell>{formatCurrency(s.totalCents)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(s.paidCents)}</TableCell>
                    <TableCell className="text-orange-600">{formatCurrency(s.pendingCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lancamentos</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-40" placeholder="De" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-40" placeholder="Ate" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Apolice</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pgto</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><div className="h-4 animate-pulse bg-muted rounded w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !commissions?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma comissao encontrada
                  </TableCell>
                </TableRow>
              ) : (
                commissions.data.map((c: CommissionPayment) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.seller?.name || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.receivable?.policy?.policyNumber || '-'}
                    </TableCell>
                    <TableCell>{c.receivable?.installmentNumber || '-'}</TableCell>
                    <TableCell>{formatCurrency(c.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[c.status] || 'outline'}>
                        {statusLabels[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.paidDate ? formatDate(c.paidDate) : '-'}</TableCell>
                    <TableCell>
                      {c.status === 'pending' && (
                        <Button size="sm" variant="outline"
                          onClick={() => { if (confirm('Confirmar pagamento desta comissao?')) payMutation.mutate(c.id); }}
                          disabled={payMutation.isPending}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />Pagar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
