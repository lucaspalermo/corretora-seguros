'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { quotesService } from '@/services/quotes.service';
import type { Client, Seller, InsuranceCategory, PaginatedResponse } from '@/types/api.types';
import { getRiskFormByCategory } from '@/components/forms/risk-forms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  auto: 'Auto',
  health: 'Saude',
  life: 'Vida',
  property: 'Residencial',
  business: 'Empresarial',
  dental: 'Odonto',
  travel: 'Viagem',
};

const categories: InsuranceCategory[] = [
  'auto', 'health', 'life', 'property', 'business', 'dental', 'travel',
];

export default function NewQuotePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [clientId, setClientId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [category, setCategory] = useState<InsuranceCategory | ''>('');

  // Step 2 state
  const [riskData, setRiskData] = useState<Record<string, string>>({});

  // Fetch clients
  const { data: clientsData } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
  });

  // Fetch sellers
  const { data: sellersData } = useQuery<PaginatedResponse<Seller>>({
    queryKey: ['sellers'],
    queryFn: async () => {
      const { data } = await api.get('/sellers');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      clientId: string; sellerId: string; category: string; riskData: string;
    }) => quotesService.create(payload),
    onSuccess: (data) => {
      router.push(`/quotes/${data.id}`);
    },
  });

  const selectedClient = clientsData?.data.find((c) => c.id === clientId);
  const selectedSeller = sellersData?.data.find((s) => s.id === sellerId);

  const RiskForm = category ? getRiskFormByCategory(category as InsuranceCategory) : null;

  function handleCreate() {
    if (!clientId || !sellerId || !category) return;
    createMutation.mutate({
      clientId,
      sellerId,
      category,
      riskData: JSON.stringify(riskData),
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/quotes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Nova Cotacao</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Dados Basicos' : s === 2 ? 'Dados do Risco' : 'Confirmacao'}
            </span>
            {s < 3 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Client + Category + Seller */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 1 - Dados Basicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientsData?.data.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={sellerId} onValueChange={setSellerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {sellersData?.data.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as InsuranceCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!clientId || !sellerId || !category}
              >
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Risk Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 2 - Dados do Risco ({categoryLabels[category] || category})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {RiskForm && <RiskForm defaultValues={riskData} onChange={setRiskData} />}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm + Create */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 3 - Confirmacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{selectedClient?.name || '-'}</span>
                <span className="text-muted-foreground">Vendedor:</span>
                <span className="font-medium">{selectedSeller?.name || '-'}</span>
                <span className="text-muted-foreground">Categoria:</span>
                <span className="font-medium">{categoryLabels[category] || category}</span>
              </div>

              {Object.keys(riskData).length > 0 && (
                <>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Dados do Risco:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(riskData).map(([key, value]) =>
                        value ? (
                          <div key={key} className="contents">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span>{value}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Criando...' : 'Criar Cotacao'}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {createMutation.isError && (
              <p className="text-sm text-destructive">
                Erro ao criar cotacao. Tente novamente.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
