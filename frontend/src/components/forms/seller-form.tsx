'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Seller } from '@/types/api.types';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  cpf: z.string().min(11, 'CPF invalido'),
  defaultCommissionPct: z.number().min(0).max(100),
  specialCommissionPct: z.number().min(0).max(100).optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Partial<Seller>;
  onSubmit: (data: FormData) => Promise<any>;
  loading?: boolean;
}

export function SellerForm({ initialData, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      cpf: initialData?.cpf || '',
      defaultCommissionPct: initialData?.defaultCommissionPct || 0,
      specialCommissionPct: initialData?.specialCommissionPct || undefined,
      phone: initialData?.phone || '',
      email: initialData?.email || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input {...register('name')} placeholder="Nome completo" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>CPF *</Label>
          <Input {...register('cpf')} placeholder="000.000.000-00" />
          {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Comissao Padrao (%) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('defaultCommissionPct', { valueAsNumber: true })}
            placeholder="10.00"
          />
          {errors.defaultCommissionPct && (
            <p className="text-sm text-destructive">{errors.defaultCommissionPct.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Comissao Diferenciada (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('specialCommissionPct', { valueAsNumber: true })}
            placeholder="12.50"
          />
        </div>

        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input {...register('phone')} placeholder="(00) 00000-0000" />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register('email')} type="email" placeholder="vendedor@email.com" />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
