'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { policiesService } from '@/services/policies.service';
import type { DashboardStats } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { FileText, Users, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
  });

  const { data: upcomingRenewals } = useQuery<any[]>({
    queryKey: ['upcoming-renewals'],
    queryFn: () => policiesService.getUpcomingRenewals(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Apolices Ativas',
      value: stats?.activePolicies || 0,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Total Clientes',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'A Receber (Mes)',
      value: formatCurrency(stats?.monthlyDueCents || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Inadimplentes',
      value: stats?.overdueCount || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recebido no Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats?.monthlyReceivedCents || 0)}
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>Comissao corretora: {formatCurrency(stats?.monthlyBrokerCommissionCents || 0)}</p>
              <p>Comissao vendedores: {formatCurrency(stats?.monthlySellerCommissionCents || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apolices por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.policiesByCategory?.map((cat) => {
                const labels: Record<string, string> = {
                  auto: 'Auto', health: 'Saude', life: 'Vida',
                  business: 'Empresarial', other: 'Outros',
                };
                return (
                  <div key={cat.category} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {labels[cat.category] || cat.category}
                    </span>
                    <span className="font-medium">{cat.count}</span>
                  </div>
                );
              })}
              {(!stats?.policiesByCategory || stats.policiesByCategory.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhuma apolice cadastrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Renovacoes Proximas (30 dias)</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {!upcomingRenewals || upcomingRenewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma apolice proxima do vencimento</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apolice</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Operadora</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Auto-renovar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingRenewals.map((policy: any) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <Link href={`/policies/${policy.id}`} className="text-primary hover:underline font-mono text-sm">
                        {policy.policyNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{policy.client?.name || '-'}</TableCell>
                    <TableCell>{policy.insurer?.name || '-'}</TableCell>
                    <TableCell>
                      {policy.endDate
                        ? new Date(policy.endDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={policy.autoRenew ? 'default' : 'secondary'}>
                        {policy.autoRenew ? 'Sim' : 'Nao'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
