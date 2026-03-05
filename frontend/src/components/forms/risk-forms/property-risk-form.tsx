'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  propertyType: z.enum(['house', 'apartment']),
  constructionType: z.enum(['masonry', 'wood', 'mixed']),
  addressCity: z.string().min(2, 'Cidade obrigatoria'),
  addressState: z.string().length(2, 'UF deve ter 2 caracteres'),
  addressZip: z.string().min(8, 'CEP invalido'),
  propertyValueCents: z.number().min(1, 'Valor do imovel obrigatorio'),
  coverFireCents: z.number().min(0),
  coverTheftCents: z.number().min(0),
  coverElectricalCents: z.number().min(0),
  wantAssistance24h: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function PropertyRiskForm({ defaultValues, onChange }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyType: defaultValues?.propertyType || 'house',
      constructionType: defaultValues?.constructionType || 'masonry',
      addressCity: defaultValues?.addressCity || '',
      addressState: defaultValues?.addressState || '',
      addressZip: defaultValues?.addressZip || '',
      propertyValueCents: defaultValues?.propertyValueCents || 0,
      coverFireCents: defaultValues?.coverFireCents || 0,
      coverTheftCents: defaultValues?.coverTheftCents || 0,
      coverElectricalCents: defaultValues?.coverElectricalCents || 0,
      wantAssistance24h: defaultValues?.wantAssistance24h ?? true,
    },
  });

  const formData = watch();

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dados do Imovel</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de Imovel *</Label>
          <Select
            value={watch('propertyType')}
            onValueChange={(v) => setValue('propertyType', v as FormData['propertyType'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="house">Casa</SelectItem>
              <SelectItem value="apartment">Apartamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Construcao *</Label>
          <Select
            value={watch('constructionType')}
            onValueChange={(v) => setValue('constructionType', v as FormData['constructionType'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="masonry">Alvenaria</SelectItem>
              <SelectItem value="wood">Madeira</SelectItem>
              <SelectItem value="mixed">Mista</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Endereco</h3>
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
        <div className="space-y-2">
          <Label>CEP *</Label>
          <Input {...register('addressZip')} placeholder="00000-000" />
          {errors.addressZip && <p className="text-sm text-destructive">{errors.addressZip.message}</p>}
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Valor do Imovel (R$) *</Label>
          <Input {...register('propertyValueCents', { valueAsNumber: true })} type="number" placeholder="500000" />
          {errors.propertyValueCents && <p className="text-sm text-destructive">{errors.propertyValueCents.message}</p>}
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
          <Label>Danos Eletricos</Label>
          <Input {...register('coverElectricalCents', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="wantAssistance24h"
          checked={watch('wantAssistance24h')}
          onCheckedChange={(v) => setValue('wantAssistance24h', !!v)}
        />
        <Label htmlFor="wantAssistance24h">Assistencia 24h</Label>
      </div>
    </div>
  );
}
