'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InsurerForm } from '@/components/forms/insurer-form';
import { insurersService } from '@/services/insurers.service';

export default function EditInsurerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: insurer, isLoading } = useQuery({
    queryKey: ['insurer', id],
    queryFn: () => insurersService.get(id),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => insurersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurer', id] });
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
      router.push(`/insurers/${id}`);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Erro ao atualizar'),
  });

  if (isLoading) return <div className="animate-pulse"><div className="h-64 bg-muted rounded" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Operadora</h1>
      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Dados da Operadora</CardTitle></CardHeader>
        <CardContent>
          <InsurerForm
            initialData={insurer ? { ...insurer, defaultCommissionPct: Number(insurer.defaultCommissionPct) } : undefined}
            onSubmit={mutation.mutateAsync}
            loading={mutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
