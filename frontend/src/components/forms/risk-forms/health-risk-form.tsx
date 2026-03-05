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
  coverageArea: z.enum(['municipal', 'state', 'regional', 'national']),
  accommodation: z.enum(['ward', 'private']),
  withCopay: z.boolean(),
  wantDental: z.boolean(),
  currentOperator: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function HealthRiskForm({ defaultValues, onChange }: Props) {
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
      coverageArea: defaultValues?.coverageArea || 'state',
      accommodation: defaultValues?.accommodation || 'ward',
      withCopay: defaultValues?.withCopay ?? false,
      wantDental: defaultValues?.wantDental ?? false,
      currentOperator: defaultValues?.currentOperator || '',
    },
  });

  const formData = watch();

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Plano de Saude</h3>
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
        <div className="space-y-2">
          <Label>Abrangencia *</Label>
          <Select
            value={watch('coverageArea')}
            onValueChange={(v) => setValue('coverageArea', v as FormData['coverageArea'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="municipal">Municipal</SelectItem>
              <SelectItem value="state">Estadual</SelectItem>
              <SelectItem value="regional">Regional</SelectItem>
              <SelectItem value="national">Nacional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Acomodacao *</Label>
          <Select
            value={watch('accommodation')}
            onValueChange={(v) => setValue('accommodation', v as FormData['accommodation'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ward">Enfermaria</SelectItem>
              <SelectItem value="private">Apartamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Operadora Atual</Label>
          <Input {...register('currentOperator')} placeholder="Ex: Unimed, Amil..." />
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Opcoes Adicionais</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="withCopay"
            checked={watch('withCopay')}
            onCheckedChange={(v) => setValue('withCopay', !!v)}
          />
          <Label htmlFor="withCopay">Com Coparticipacao</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantDental"
            checked={watch('wantDental')}
            onCheckedChange={(v) => setValue('wantDental', !!v)}
          />
          <Label htmlFor="wantDental">Incluir Odontologico</Label>
        </div>
      </div>
    </div>
  );
}
