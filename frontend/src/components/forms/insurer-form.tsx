'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Insurer } from '@/types/api.types';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  category: z.enum(['auto', 'health', 'life', 'business', 'other']),
  defaultCommissionPct: z.number().min(0).max(100),
  paymentMethod: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Email invalido').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Partial<Insurer>;
  onSubmit: (data: FormData) => Promise<any>;
  loading?: boolean;
}

export function InsurerForm({ initialData, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      category: (initialData?.category as any) || 'auto',
      defaultCommissionPct: initialData?.defaultCommissionPct || 0,
      paymentMethod: initialData?.paymentMethod || '',
      contactName: initialData?.contactName || '',
      contactPhone: initialData?.contactPhone || '',
      contactEmail: initialData?.contactEmail || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome da Operadora *</Label>
          <Input {...register('name')} placeholder="Ex: Porto Seguro" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={watch('category')} onValueChange={(v: any) => setValue('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="health">Saude</SelectItem>
              <SelectItem value="life">Vida</SelectItem>
              <SelectItem value="business">Empresarial</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Comissao Padrao (%) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('defaultCommissionPct', { valueAsNumber: true })}
            placeholder="15.00"
          />
          {errors.defaultCommissionPct && (
            <p className="text-sm text-destructive">{errors.defaultCommissionPct.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Forma de Repasse</Label>
          <Input {...register('paymentMethod')} placeholder="Ex: Mensal, Trimestral..." />
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Contato</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Nome do Contato</Label>
          <Input {...register('contactName')} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input {...register('contactPhone')} placeholder="(00) 0000-0000" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register('contactEmail')} type="email" />
          {errors.contactEmail && (
            <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
          )}
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
