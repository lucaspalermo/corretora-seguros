'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InsurerForm } from '@/components/forms/insurer-form';
import { insurersService } from '@/services/insurers.service';

export default function NewInsurerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => insurersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
      router.push('/insurers');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao cadastrar operadora');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Operadora</h1>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <Card>
        <CardHeader><CardTitle>Dados da Operadora</CardTitle></CardHeader>
        <CardContent>
          <InsurerForm onSubmit={mutation.mutateAsync} loading={mutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
