'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  insuredName: z.string().min(2, 'Nome obrigatorio'),
  insuredBirthDate: z.string().min(1, 'Data de nascimento obrigatoria'),
  insuredProfession: z.string().min(2, 'Profissao obrigatoria'),
  isSmoker: z.boolean(),
  capitalAmountCents: z.number().min(1, 'Capital segurado obrigatorio'),
  wantDeath: z.boolean(),
  wantDisability: z.boolean(),
  wantFuneral: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function LifeRiskForm({ defaultValues, onChange }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      insuredName: defaultValues?.insuredName || '',
      insuredBirthDate: defaultValues?.insuredBirthDate || '',
      insuredProfession: defaultValues?.insuredProfession || '',
      isSmoker: defaultValues?.isSmoker ?? false,
      capitalAmountCents: defaultValues?.capitalAmountCents || 0,
      wantDeath: defaultValues?.wantDeath ?? true,
      wantDisability: defaultValues?.wantDisability ?? true,
      wantFuneral: defaultValues?.wantFuneral ?? false,
    },
  });

  const formData = watch();

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dados do Segurado</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome do Segurado *</Label>
          <Input {...register('insuredName')} placeholder="Nome completo" />
          {errors.insuredName && <p className="text-sm text-destructive">{errors.insuredName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data de Nascimento *</Label>
          <Input {...register('insuredBirthDate')} type="date" />
          {errors.insuredBirthDate && <p className="text-sm text-destructive">{errors.insuredBirthDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Profissao *</Label>
          <Input {...register('insuredProfession')} placeholder="Ex: Engenheiro" />
          {errors.insuredProfession && <p className="text-sm text-destructive">{errors.insuredProfession.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Capital Segurado (R$) *</Label>
          <Input {...register('capitalAmountCents', { valueAsNumber: true })} type="number" placeholder="100000" />
          {errors.capitalAmountCents && <p className="text-sm text-destructive">{errors.capitalAmountCents.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="isSmoker"
          checked={watch('isSmoker')}
          onCheckedChange={(v) => setValue('isSmoker', !!v)}
        />
        <Label htmlFor="isSmoker">Fumante</Label>
      </div>

      <h3 className="text-lg font-semibold pt-4">Coberturas Desejadas</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantDeath"
            checked={watch('wantDeath')}
            onCheckedChange={(v) => setValue('wantDeath', !!v)}
          />
          <Label htmlFor="wantDeath">Morte</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantDisability"
            checked={watch('wantDisability')}
            onCheckedChange={(v) => setValue('wantDisability', !!v)}
          />
          <Label htmlFor="wantDisability">Invalidez (IPA)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantFuneral"
            checked={watch('wantFuneral')}
            onCheckedChange={(v) => setValue('wantFuneral', !!v)}
          />
          <Label htmlFor="wantFuneral">Assistencia Funeral</Label>
        </div>
      </div>
    </div>
  );
}
