'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  companyName: z.string().min(2, 'Razao social obrigatoria'),
  cnpj: z.string().min(14, 'CNPJ invalido'),
  cnae: z.string().min(1, 'CNAE obrigatorio'),
  addressCity: z.string().min(2, 'Cidade obrigatoria'),
  addressState: z.string().length(2, 'UF deve ter 2 caracteres'),
  employeeCount: z.number().min(0, 'Numero invalido'),
  annualRevenueCents: z.number().min(0),
  coverFireCents: z.number().min(0),
  coverTheftCents: z.number().min(0),
  coverCivilLiabilityCents: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function BusinessRiskForm({ defaultValues, onChange }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: defaultValues?.companyName || '',
      cnpj: defaultValues?.cnpj || '',
      cnae: defaultValues?.cnae || '',
      addressCity: defaultValues?.addressCity || '',
      addressState: defaultValues?.addressState || '',
      employeeCount: defaultValues?.employeeCount || 0,
      annualRevenueCents: defaultValues?.annualRevenueCents || 0,
      coverFireCents: defaultValues?.coverFireCents || 0,
      coverTheftCents: defaultValues?.coverTheftCents || 0,
      coverCivilLiabilityCents: defaultValues?.coverCivilLiabilityCents || 0,
    },
  });

  const formData = watch();

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dados da Empresa</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Razao Social *</Label>
          <Input {...register('companyName')} placeholder="Nome da empresa" />
          {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>CNPJ *</Label>
          <Input {...register('cnpj')} placeholder="00.000.000/0001-00" />
          {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>CNAE *</Label>
          <Input {...register('cnae')} placeholder="Ex: 4711-3/02" />
          {errors.cnae && <p className="text-sm text-destructive">{errors.cnae.message}</p>}
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Localizacao</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 col-span-2">
          <Label>Cidade *</Label>
          <Input {...register('addressCity')} placeholder="Cidade" />
          {errors.addressCity && <p className="text-sm text-destructive">{errors.addressCity.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>UF *</Label>
          <Input {...register('addressState')} placeholder="SP" maxLength={2} />
          {errors.addressState && <p className="text-sm text-destructive">{errors.addressState.message}</p>}
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Informacoes Financeiras</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Numero de Funcionarios</Label>
          <Input {...register('employeeCount', { valueAsNumber: true })} type="number" min={0} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Faturamento Anual (R$)</Label>
          <Input {...register('annualRevenueCents', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Coberturas (R$)</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Incendio / Raio / Explosao</Label>
          <Input {...register('coverFireCents', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Roubo / Furto</Label>
          <Input {...register('coverTheftCents', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Responsabilidade Civil</Label>
          <Input {...register('coverCivilLiabilityCents', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
      </div>
    </div>
  );
}
