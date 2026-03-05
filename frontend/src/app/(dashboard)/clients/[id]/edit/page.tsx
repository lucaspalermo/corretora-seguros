'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/components/forms/client-form';
import { clientsService } from '@/services/clients.service';

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.get(id),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => clientsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push(`/clients/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao atualizar cliente');
    },
  });

  if (isLoading) return <div className="animate-pulse"><div className="h-64 bg-muted rounded" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Cliente</h1>
      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
        <CardContent>
          <ClientForm initialData={client} onSubmit={mutation.mutateAsync} loading={mutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
