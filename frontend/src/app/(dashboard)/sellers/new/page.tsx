'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SellerForm } from '@/components/forms/seller-form';
import { sellersService } from '@/services/sellers.service';

export default function NewSellerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => sellersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      router.push('/sellers');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao cadastrar vendedor');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Vendedor</h1>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <Card>
        <CardHeader><CardTitle>Dados do Vendedor</CardTitle></CardHeader>
        <CardContent>
          <SellerForm onSubmit={mutation.mutateAsync} loading={mutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
