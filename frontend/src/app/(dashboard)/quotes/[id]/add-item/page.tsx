'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { quotesService } from '@/services/quotes.service';
import type { Insurer, PaginatedResponse } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function AddItemPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [insurerId, setInsurerId] = useState('');
  const [premiumReais, setPremiumReais] = useState('');
  const [installments, setInstallments] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [brokerCommissionPct, setBrokerCommissionPct] = useState('');
  const [sellerCommissionPct, setSellerCommissionPct] = useState('');
  const [proposalNumber, setProposalNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Dynamic coverages
  const [coverages, setCoverages] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);

  // Dynamic conditions
  const [conditions, setConditions] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);

  const { data: insurersData } = useQuery<PaginatedResponse<Insurer>>({
    queryKey: ['insurers'],
    queryFn: async () => {
      const { data } = await api.get('/insurers?status=active');
      return data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: () => {
      const coveragesObj: Record<string, string> = {};
      coverages.forEach((c) => {
        if (c.key.trim()) coveragesObj[c.key.trim()] = c.value.trim();
      });

      const conditionsObj: Record<string, string> = {};
      conditions.forEach((c) => {
        if (c.key.trim()) conditionsObj[c.key.trim()] = c.value.trim();
      });

      const premiumCents = Math.round(parseFloat(premiumReais || '0') * 100);

      return quotesService.addItem(quoteId, {
        insurerId,
        premiumCents,
        installments: parseInt(installments) || 1,
        paymentMethod: paymentMethod || undefined,
        brokerCommissionPct: parseFloat(brokerCommissionPct) || 0,
        sellerCommissionPct: parseFloat(sellerCommissionPct) || undefined,
        coverages: JSON.stringify(coveragesObj),
        conditions: JSON.stringify(conditionsObj),
        proposalNumber: proposalNumber || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      router.push(`/quotes/${quoteId}`);
    },
  });

  function updateCoverage(index: number, field: 'key' | 'value', val: string) {
    const updated = [...coverages];
    updated[index] = { ...updated[index], [field]: val };
    setCoverages(updated);
  }

  function addCoverage() {
    setCoverages([...coverages, { key: '', value: '' }]);
  }

  function removeCoverage(index: number) {
    setCoverages(coverages.filter((_, i) => i !== index));
  }

  function updateCondition(index: number, field: 'key' | 'value', val: string) {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: val };
    setConditions(updated);
  }

  function addCondition() {
    setConditions([...conditions, { key: '', value: '' }]);
  }

  function removeCondition(index: number) {
    setConditions(conditions.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!insurerId || !premiumReais || !brokerCommissionPct) return;
    addItemMutation.mutate();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/quotes/${quoteId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Adicionar Cotacao de Operadora</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da Cotacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Insurer */}
            <div className="space-y-2">
              <Label>Operadora *</Label>
              <Select value={insurerId} onValueChange={setInsurerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a operadora" />
                </SelectTrigger>
                <SelectContent>
                  {insurersData?.data.map((insurer) => (
                    <SelectItem key={insurer.id} value={insurer.id}>
                      {insurer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Premium and installments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Premio Total (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={premiumReais}
                  onChange={(e) => setPremiumReais(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  max="48"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                />
              </div>
            </div>

            {/* Payment method */}
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

            {/* Commissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comissao Corretora (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={brokerCommissionPct}
                  onChange={(e) => setBrokerCommissionPct(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Comissao Vendedor (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={sellerCommissionPct}
                  onChange={(e) => setSellerCommissionPct(e.target.value)}
                />
              </div>
            </div>

            {/* Proposal number and notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numero da Proposta</Label>
                <Input
                  placeholder="Opcional"
                  value={proposalNumber}
                  onChange={(e) => setProposalNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observacoes</Label>
                <Input
                  placeholder="Opcional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverages */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Coberturas</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addCoverage}>
                <Plus className="mr-1 h-3 w-3" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {coverages.map((cov, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Nome da cobertura"
                  value={cov.key}
                  onChange={(e) => updateCoverage(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Valor (R$)"
                  value={cov.value}
                  onChange={(e) => updateCoverage(index, 'value', e.target.value)}
                  className="flex-1"
                />
                {coverages.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCoverage(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Condicoes</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                <Plus className="mr-1 h-3 w-3" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {conditions.map((cond, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Nome da condicao"
                  value={cond.key}
                  onChange={(e) => updateCondition(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Valor"
                  value={cond.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  className="flex-1"
                />
                {conditions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            size="lg"
            disabled={!insurerId || !premiumReais || !brokerCommissionPct || addItemMutation.isPending}
          >
            {addItemMutation.isPending ? 'Salvando...' : 'Salvar Cotacao'}
          </Button>
        </div>

        {addItemMutation.isError && (
          <p className="text-sm text-destructive mt-2">
            Erro ao salvar cotacao. Tente novamente.
          </p>
        )}
      </form>
    </div>
  );
}
