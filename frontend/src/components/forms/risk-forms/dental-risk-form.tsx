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
  planType: z.enum(['individual', 'family', 'business']),
  numberOfLives: z.number().min(1, 'Minimo 1 vida'),
  wantOrthodontics: z.boolean(),
  wantProsthetics: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function DentalRiskForm({ defaultValues, onChange }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      planType: defaultValues?.planType || 'individual',
      numberOfLives: defaultValues?.numberOfLives || 1,
      wantOrthodontics: defaultValues?.wantOrthodontics ?? false,
      wantProsthetics: defaultValues?.wantProsthetics ?? false,
    },
  });

  const formData = watch();

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Plano Odontologico</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de Plano *</Label>
          <Select
            value={watch('planType')}
            onValueChange={(v) => setValue('planType', v as FormData['planType'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="family">Familiar</SelectItem>
              <SelectItem value="business">Empresarial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantidade de Vidas *</Label>
          <Input {...register('numberOfLives', { valueAsNumber: true })} type="number" min={1} placeholder="1" />
          {errors.numberOfLives && <p className="text-sm text-destructive">{errors.numberOfLives.message}</p>}
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Coberturas Adicionais</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantOrthodontics"
            checked={watch('wantOrthodontics')}
            onCheckedChange={(v) => setValue('wantOrthodontics', !!v)}
          />
          <Label htmlFor="wantOrthodontics">Ortodontia</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantProsthetics"
            checked={watch('wantProsthetics')}
            onCheckedChange={(v) => setValue('wantProsthetics', !!v)}
          />
          <Label htmlFor="wantProsthetics">Protese</Label>
        </div>
      </div>
    </div>
  );
}
