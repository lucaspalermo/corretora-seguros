'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PolicyForm } from '@/components/forms/policy-form';
import { policiesService } from '@/services/policies.service';

export default function NewPolicyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => policiesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      router.push('/policies');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao cadastrar apolice');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Apolice</h1>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <Card>
        <CardHeader><CardTitle>Dados da Apolice</CardTitle></CardHeader>
        <CardContent>
          <PolicyForm onSubmit={mutation.mutateAsync} loading={mutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
