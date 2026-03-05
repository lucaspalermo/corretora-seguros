'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/components/forms/client-form';
import { clientsService } from '@/services/clients.service';

export default function NewClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push('/clients');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao cadastrar cliente');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Cliente</h1>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm onSubmit={mutation.mutateAsync} loading={mutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
