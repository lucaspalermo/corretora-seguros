'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  destination: z.string().min(2, 'Destino obrigatorio'),
  departureDate: z.string().min(1, 'Data de ida obrigatoria'),
  returnDate: z.string().min(1, 'Data de volta obrigatoria'),
  numberOfTravelers: z.number().min(1, 'Minimo 1 viajante'),
  wantMedical: z.boolean(),
  wantBaggage: z.boolean(),
  wantCancellation: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function TravelRiskForm({ defaultValues, onChange }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      destination: defaultValues?.destination || '',
      departureDate: defaultValues?.departureDate || '',
      returnDate: defaultValues?.returnDate || '',
      numberOfTravelers: defaultValues?.numberOfTravelers || 1,
      wantMedical: defaultValues?.wantMedical ?? true,
      wantBaggage: defaultValues?.wantBaggage ?? true,
      wantCancellation: defaultValues?.wantCancellation ?? false,
    },
  });

  const formData = watch();

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Seguro Viagem</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Destino *</Label>
          <Input {...register('destination')} placeholder="Ex: Europa, EUA, Nacional..." />
          {errors.destination && <p className="text-sm text-destructive">{errors.destination.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Numero de Viajantes *</Label>
          <Input {...register('numberOfTravelers', { valueAsNumber: true })} type="number" min={1} placeholder="1" />
          {errors.numberOfTravelers && <p className="text-sm text-destructive">{errors.numberOfTravelers.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data de Ida *</Label>
          <Input {...register('departureDate')} type="date" />
          {errors.departureDate && <p className="text-sm text-destructive">{errors.departureDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data de Volta *</Label>
          <Input {...register('returnDate')} type="date" />
          {errors.returnDate && <p className="text-sm text-destructive">{errors.returnDate.message}</p>}
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Coberturas</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantMedical"
            checked={watch('wantMedical')}
            onCheckedChange={(v) => setValue('wantMedical', !!v)}
          />
          <Label htmlFor="wantMedical">Despesas Medicas</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantBaggage"
            checked={watch('wantBaggage')}
            onCheckedChange={(v) => setValue('wantBaggage', !!v)}
          />
          <Label htmlFor="wantBaggage">Extravio de Bagagem</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantCancellation"
            checked={watch('wantCancellation')}
            onCheckedChange={(v) => setValue('wantCancellation', !!v)}
          />
          <Label htmlFor="wantCancellation">Cancelamento de Viagem</Label>
        </div>
      </div>
    </div>
  );
}
