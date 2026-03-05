'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policiesService } from '@/services/policies.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate, formatCurrency, categoryLabels, policyTypeLabels, paymentMethodLabels, receivableStatusLabels } from '@/lib/format';
import { ArrowLeft, Pencil, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { DocumentList } from '@/components/documents/document-list';

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy', id],
    queryFn: () => policiesService.get(id),
  });

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewPremium, setRenewPremium] = useState('');
  const [renewInstallments, setRenewInstallments] = useState('');

  const cancelMutation = useMutation({
    mutationFn: () => policiesService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy', id] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => {
      const overrides: any = {};
      if (renewPremium) overrides.premiumCents = Math.round(parseFloat(renewPremium) * 100);
      if (renewInstallments) overrides.installments = parseInt(renewInstallments);
      return policiesService.renew(id, Object.keys(overrides).length ? overrides : undefined);
    },
    onSuccess: (data) => {
      setRenewOpen(false);
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      router.push(`/policies/${data.id}`);
    },
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="h-64 bg-muted rounded" /></div>;
  }

  if (!policy) return <p>Apolice nao encontrada</p>;

  const typeVariant = policy.type === 'active' ? 'default' : policy.type === 'cancelled' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/policies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{policy.policyNumber}</h1>
            <p className="text-muted-foreground">{policy.client?.name}</p>
          </div>
          <Badge variant={typeVariant}>{policyTypeLabels[policy.type]}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/policies/${id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
          </Button>
          {policy.type === 'active' && (
            <Button
              variant="outline"
              onClick={() => setRenewOpen(true)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />Renovar
            </Button>
          )}
          {policy.type !== 'cancelled' && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Cancelar apolice? Parcelas pendentes serao canceladas.')) cancelMutation.mutate();
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />Cancelar Apolice
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{categoryLabels[policy.category]}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Operadora</span><span>{policy.insurer?.name}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Vendedor</span><span>{policy.seller?.name}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Pagamento</span><span>{paymentMethodLabels[policy.paymentMethod]}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Renovacao auto</span><span>{policy.autoRenew ? 'Sim' : 'Nao'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Valores</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Premio Total</span><span className="font-bold">{formatCurrency(policy.premiumCents)}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Parcelas</span><span>{policy.installments}x de {formatCurrency(Math.floor(policy.premiumCents / policy.installments))}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Comissao Corretora</span><span>{Number(policy.brokerCommissionPct)}%</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Comissao Vendedor</span><span>{Number(policy.sellerCommissionPct)}%</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Datas</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Inicio</span><span>{formatDate(policy.startDate)}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Vigencia</span><span>{policy.endDate ? formatDate(policy.endDate) : '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Renovacao</span><span>{policy.renewalDate ? formatDate(policy.renewalDate) : '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Cadastro</span><span>{formatDate(policy.createdAt)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Parcelas ({policy.receivables?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor Bruto</TableHead>
                <TableHead>Comissao Corr.</TableHead>
                <TableHead>Comissao Vend.</TableHead>
                <TableHead>Liquido</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policy.receivables?.map((r: any) => {
                const statusVariant = r.status === 'received' ? 'default' : r.status === 'overdue' ? 'destructive' : r.status === 'cancelled' ? 'secondary' : 'outline';
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.installmentNumber}/{policy.installments}</TableCell>
                    <TableCell>{formatDate(r.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(r.grossAmountCents)}</TableCell>
                    <TableCell>{formatCurrency(r.brokerCommissionCents)}</TableCell>
                    <TableCell>{formatCurrency(r.sellerCommissionCents)}</TableCell>
                    <TableCell>{formatCurrency(r.netAmountCents)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>{receivableStatusLabels[r.status] || r.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Documentos</CardTitle></CardHeader>
        <CardContent>
          <DocumentList entity="policy" entityId={id} />
        </CardContent>
      </Card>

      {/* Renewal Dialog */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Apolice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              A apolice atual sera encerrada e uma nova sera criada com vigencia de 1 ano.
              Deixe os campos em branco para manter os valores atuais.
            </p>
            <div className="space-y-2">
              <Label>Premio Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={renewPremium}
                onChange={(e) => setRenewPremium(e.target.value)}
                placeholder={`Atual: ${formatCurrency(policy.premiumCents)}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={renewInstallments}
                onChange={(e) => setRenewInstallments(e.target.value)}
                placeholder={`Atual: ${policy.installments}x`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => renewMutation.mutate()}
              disabled={renewMutation.isPending}
            >
              {renewMutation.isPending ? 'Renovando...' : 'Renovar'}
            </Button>
          </DialogFooter>
          {renewMutation.isError && (
            <p className="text-sm text-destructive">Erro ao renovar. Tente novamente.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
