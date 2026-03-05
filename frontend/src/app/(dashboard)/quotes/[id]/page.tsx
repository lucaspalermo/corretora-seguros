'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { quotesService } from '@/services/quotes.service';
import type { Quote, QuoteItem } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Check, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  accepted: 'Aceita',
  expired: 'Expirada',
  cancelled: 'Cancelada',
};

const statusVariants: Record<string, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  draft: 'outline',
  sent: 'secondary',
  accepted: 'default',
  expired: 'destructive',
  cancelled: 'destructive',
};

const categoryLabels: Record<string, string> = {
  auto: 'Auto',
  health: 'Saude',
  life: 'Vida',
  property: 'Residencial',
  business: 'Empresarial',
  dental: 'Odonto',
  travel: 'Viagem',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function safeParseJson(str: string | undefined | null): Record<string, string> {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quoteId = params.id as string;

  const [convertOpen, setConvertOpen] = useState(false);
  const [policyNumber, setPolicyNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ['quote', quoteId],
    queryFn: () => quotesService.get(quoteId),
  });

  const selectMutation = useMutation({
    mutationFn: (itemId: string) => quotesService.selectItem(quoteId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => quotesService.removeItem(quoteId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: () =>
      quotesService.convertToPolicy(quoteId, {
        policyNumber,
        startDate,
        endDate: endDate || undefined,
        paymentMethod,
      }),
    onSuccess: (data) => {
      setConvertOpen(false);
      router.push(`/policies/${data.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 animate-pulse bg-muted rounded w-48" />
        <div className="h-64 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cotacao nao encontrada.
      </div>
    );
  }

  const items = quote.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/quotes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quote.title}</h1>
              <Badge variant={statusVariants[quote.status] || 'outline'}>
                {statusLabels[quote.status] || quote.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Cliente: {quote.client?.name || '-'} | Categoria: {categoryLabels[quote.category] || quote.category} | Criado em: {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/quotes/${quoteId}/add-item`}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Cotacao
          </Link>
        </Button>
      </div>

      {/* Comparison Table */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma cotacao de operadora adicionada ainda.
            <br />
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/quotes/${quoteId}/add-item`}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeira cotacao
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Cotacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-muted font-medium min-w-[180px]">Detalhe</th>
                    {items.map((item) => (
                      <th
                        key={item.id}
                        className={`text-center p-3 min-w-[200px] ${
                          quote.acceptedItemId === item.id
                            ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20'
                            : 'bg-muted'
                        }`}
                      >
                        {item.insurer?.name || 'Operadora'}
                        {quote.acceptedItemId === item.id && (
                          <Badge variant="default" className="ml-2 bg-green-600">Selecionada</Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Operadora */}
                  <tr className="border-b">
                    <td className="p-3 font-medium">Operadora</td>
                    {items.map((item) => (
                      <td key={item.id} className={`p-3 text-center ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                        {item.insurer?.name || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Premio Total */}
                  <tr className="border-b">
                    <td className="p-3 font-medium">Premio Total</td>
                    {items.map((item) => (
                      <td key={item.id} className={`p-3 text-center font-semibold ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                        {formatCurrency(item.premiumCents)}
                      </td>
                    ))}
                  </tr>

                  {/* Parcela Mensal */}
                  <tr className="border-b">
                    <td className="p-3 font-medium">Parcela Mensal</td>
                    {items.map((item) => (
                      <td key={item.id} className={`p-3 text-center ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                        {item.installments > 0
                          ? formatCurrency(Math.round(item.premiumCents / item.installments))
                          : '-'}
                        {item.installments > 0 && (
                          <span className="text-xs text-muted-foreground block">
                            ({item.installments}x)
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Comissao Corretora */}
                  <tr className="border-b">
                    <td className="p-3 font-medium">Comissao Corretora</td>
                    {items.map((item) => (
                      <td key={item.id} className={`p-3 text-center ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                        {item.brokerCommissionPct}%
                      </td>
                    ))}
                  </tr>

                  {/* Comissao Vendedor */}
                  <tr className="border-b">
                    <td className="p-3 font-medium">Comissao Vendedor</td>
                    {items.map((item) => (
                      <td key={item.id} className={`p-3 text-center ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                        {item.sellerCommissionPct}%
                      </td>
                    ))}
                  </tr>

                  {/* Proposta */}
                  <tr className="border-b">
                    <td className="p-3 font-medium">Proposta</td>
                    {items.map((item) => (
                      <td key={item.id} className={`p-3 text-center ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                        {item.proposalNumber || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Coberturas */}
                  <tr className="border-b">
                    <td className="p-3 font-medium align-top">Coberturas</td>
                    {items.map((item) => {
                      const coverages = safeParseJson(item.coverages);
                      return (
                        <td key={item.id} className={`p-3 text-left ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                          {Object.keys(coverages).length === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <ul className="space-y-1">
                              {Object.entries(coverages).map(([key, val]) => (
                                <li key={key} className="text-xs">
                                  <span className="font-medium">{key}:</span> {val}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Condicoes */}
                  <tr className="border-b">
                    <td className="p-3 font-medium align-top">Condicoes</td>
                    {items.map((item) => {
                      const conditions = safeParseJson(item.conditions);
                      return (
                        <td key={item.id} className={`p-3 text-left ${quote.acceptedItemId === item.id ? 'border-x-2 border-green-500' : ''}`}>
                          {Object.keys(conditions).length === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <ul className="space-y-1">
                              {Object.entries(conditions).map(([key, val]) => (
                                <li key={key} className="text-xs">
                                  <span className="font-medium">{key}:</span> {val}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="p-3 font-medium">Acoes</td>
                    {items.map((item) => (
                      <td key={item.id} className={`p-3 text-center ${quote.acceptedItemId === item.id ? 'border-x-2 border-b-2 border-green-500' : ''}`}>
                        <div className="flex flex-col items-center gap-2">
                          {quote.acceptedItemId !== item.id && (
                            <Button
                              size="sm"
                              onClick={() => selectMutation.mutate(item.id)}
                              disabled={selectMutation.isPending}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Selecionar
                            </Button>
                          )}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <Link href={`/quotes/${quoteId}/add-item?edit=${item.id}`}>
                                <Pencil className="h-3 w-3" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Remover esta cotacao?')) {
                                  removeMutation.mutate(item.id);
                                }
                              }}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Convert to Policy */}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!quote.acceptedItemId}
          onClick={() => setConvertOpen(true)}
        >
          Converter em Apolice
        </Button>
      </div>

      {/* Convert Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em Apolice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Numero da Apolice</Label>
              <Input
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Ex: APO-2026-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartao de Credito</SelectItem>
                  <SelectItem value="debit">Debito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => convertMutation.mutate()}
              disabled={!policyNumber || !startDate || !paymentMethod || convertMutation.isPending}
            >
              {convertMutation.isPending ? 'Convertendo...' : 'Converter'}
            </Button>
          </DialogFooter>
          {convertMutation.isError && (
            <p className="text-sm text-destructive">Erro ao converter. Tente novamente.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
