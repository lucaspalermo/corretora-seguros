'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Shield, FileText, AlertCircle } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const categoryLabels: Record<string, string> = {
  auto: 'Auto', health: 'Saude', life: 'Vida',
  property: 'Residencial', business: 'Empresarial',
  dental: 'Odonto', travel: 'Viagem', other: 'Outros',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

interface PortalData {
  client: {
    id: string;
    name: string;
    document: string;
    email?: string;
    phone?: string;
  };
  policies: Array<{
    id: string;
    policyNumber: string;
    category: string;
    insurerName: string;
    startDate: string;
    endDate?: string;
    premiumCents: number;
    installments: number;
  }>;
  pendingPayments: Array<{
    id: string;
    policyNumber: string;
    category: string;
    installmentNumber: number;
    grossAmountCents: number;
    dueDate: string;
    status: string;
  }>;
}

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading, error } = useQuery<PortalData>({
    queryKey: ['portal', token],
    queryFn: async () => {
      const { data } = await axios.get(`${apiBase}/client-portal/access/${token}`);
      return data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-bold mb-2">Link Invalido ou Expirado</h2>
            <p className="text-muted-foreground">
              Este link de acesso nao e valido ou ja expirou. Solicite um novo link ao seu corretor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overdueCount = data.pendingPayments.filter(p => p.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">SeguraSaaS</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">Portal do Cliente</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Client info */}
        <div>
          <h1 className="text-2xl font-bold">Ola, {data.client.name}</h1>
          <p className="text-muted-foreground">Acompanhe suas apolices e parcelas</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{data.policies.length}</div>
              <p className="text-sm text-muted-foreground">Apolices Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{data.pendingPayments.length}</div>
              <p className="text-sm text-muted-foreground">Parcelas Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-destructive">{overdueCount}</div>
              <p className="text-sm text-muted-foreground">Parcelas em Atraso</p>
            </CardContent>
          </Card>
        </div>

        {/* Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Minhas Apolices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.policies.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Nenhuma apolice ativa</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Operadora</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Premio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-mono font-medium">{policy.policyNumber}</TableCell>
                      <TableCell>{categoryLabels[policy.category] || policy.category}</TableCell>
                      <TableCell>{policy.insurerName || '-'}</TableCell>
                      <TableCell>{formatDate(policy.startDate)}</TableCell>
                      <TableCell>{policy.endDate ? formatDate(policy.endDate) : '-'}</TableCell>
                      <TableCell>
                        {formatCurrency(policy.premiumCents)}
                        <span className="text-xs text-muted-foreground block">
                          {policy.installments}x {formatCurrency(Math.round(policy.premiumCents / policy.installments))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Parcelas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendingPayments.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Nenhuma parcela pendente</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apolice</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.policyNumber}</TableCell>
                      <TableCell>{payment.installmentNumber}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.grossAmountCents)}</TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'overdue' ? 'destructive' : 'outline'}>
                          {payment.status === 'overdue' ? 'Em Atraso' : 'Pendente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 pb-4">
          Em caso de duvidas, entre em contato com seu corretor.
        </div>
      </main>
    </div>
  );
}
