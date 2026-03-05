'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SellerForm } from '@/components/forms/seller-form';
import { sellersService } from '@/services/sellers.service';

export default function EditSellerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellersService.get(id),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => sellersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', id] });
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      router.push(`/sellers/${id}`);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Erro ao atualizar'),
  });

  if (isLoading) return <div className="animate-pulse"><div className="h-64 bg-muted rounded" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Vendedor</h1>
      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Dados do Vendedor</CardTitle></CardHeader>
        <CardContent>
          <SellerForm
            initialData={seller ? {
              ...seller,
              defaultCommissionPct: Number(seller.defaultCommissionPct),
              specialCommissionPct: seller.specialCommissionPct ? Number(seller.specialCommissionPct) : undefined,
            } : undefined}
            onSubmit={mutation.mutateAsync}
            loading={mutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
