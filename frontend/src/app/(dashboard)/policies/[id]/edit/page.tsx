'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PolicyForm } from '@/components/forms/policy-form';
import { policiesService } from '@/services/policies.service';

export default function EditPolicyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy', id],
    queryFn: () => policiesService.get(id),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => policiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy', id] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      router.push(`/policies/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao atualizar apolice');
    },
  });

  if (isLoading) return <div className="animate-pulse"><div className="h-64 bg-muted rounded" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Apolice</h1>
      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Dados da Apolice</CardTitle></CardHeader>
        <CardContent>
          <PolicyForm
            initialData={policy ? {
              clientId: policy.clientId,
              insurerId: policy.insurerId,
              sellerId: policy.sellerId,
              policyNumber: policy.policyNumber,
              category: policy.category,
              startDate: policy.startDate?.split('T')[0],
              endDate: policy.endDate?.split('T')[0],
              renewalDate: policy.renewalDate?.split('T')[0],
              premiumCents: policy.premiumCents,
              paymentMethod: policy.paymentMethod,
              installments: policy.installments,
              brokerCommissionPct: Number(policy.brokerCommissionPct),
              sellerCommissionPct: Number(policy.sellerCommissionPct),
              autoRenew: policy.autoRenew,
              notes: policy.notes || '',
            } : undefined}
            onSubmit={mutation.mutateAsync}
            loading={mutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
