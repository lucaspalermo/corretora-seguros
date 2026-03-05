'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Receivable, PaginatedResponse } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

const statusLabels: Record<string, string> = {
  pending: 'Em Aberto', received: 'Recebido',
  overdue: 'Atrasado', cancelled: 'Cancelado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', received: 'default',
  overdue: 'destructive', cancelled: 'secondary',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function FinancialPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery<PaginatedResponse<Receivable>>({
    queryKey: ['receivables', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      const { data } = await api.get(`/receivables?${params}`);
      return data;
    },
  });

  const totals = data?.data.reduce(
    (acc, r) => ({
      gross: acc.gross + r.grossAmountCents,
      broker: acc.broker + r.brokerCommissionCents,
      seller: acc.seller + r.sellerCommissionCents,
      net: acc.net + r.netAmountCents,
    }),
    { gross: 0, broker: 0, seller: 0, net: 0 },
  ) || { gross: 0, broker: 0, seller: 0, net: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Button variant="outline" asChild>
          <Link href="/financial/commissions">Ver Comissoes</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totals.gross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Comissao Corretora</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.broker)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Comissao Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totals.seller)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor Liquido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totals.net)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contas a Receber</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Em Aberto</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse bg-muted rounded w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma parcela encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-mono text-sm">
                      {rec.policy?.policyNumber || '-'}
                    </TableCell>
                    <TableCell>{rec.client?.name || '-'}</TableCell>
                    <TableCell>{rec.installmentNumber}</TableCell>
                    <TableCell>{formatCurrency(rec.grossAmountCents)}</TableCell>
                    <TableCell>{formatDate(rec.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[rec.status] || 'outline'}>
                        {statusLabels[rec.status] || rec.status}
                      </Badge>
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
