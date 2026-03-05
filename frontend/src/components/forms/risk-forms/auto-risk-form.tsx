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
  vehicleMake: z.string().min(1, 'Marca obrigatoria'),
  vehicleModel: z.string().min(1, 'Modelo obrigatorio'),
  vehicleYear: z.number().min(1950, 'Ano invalido').max(2030, 'Ano invalido'),
  plate: z.string().optional(),
  vehicleUse: z.enum(['personal', 'commercial', 'rideshare']),
  garageType: z.enum(['locked_garage', 'covered', 'street', 'condo']),
  driverName: z.string().min(2, 'Nome do motorista obrigatorio'),
  driverBirthDate: z.string().min(1, 'Data de nascimento obrigatoria'),
  driverGender: z.enum(['M', 'F']),
  bonusClass: z.number().min(0).max(10).optional(),
  wantCollision: z.boolean(),
  wantThirdParty: z.boolean(),
  wantTheft: z.boolean(),
  wantGlass: z.boolean(),
  wantTow: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function AutoRiskForm({ defaultValues, onChange }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleMake: defaultValues?.vehicleMake || '',
      vehicleModel: defaultValues?.vehicleModel || '',
      vehicleYear: defaultValues?.vehicleYear || new Date().getFullYear(),
      plate: defaultValues?.plate || '',
      vehicleUse: defaultValues?.vehicleUse || 'personal',
      garageType: defaultValues?.garageType || 'locked_garage',
      driverName: defaultValues?.driverName || '',
      driverBirthDate: defaultValues?.driverBirthDate || '',
      driverGender: defaultValues?.driverGender || 'M',
      bonusClass: defaultValues?.bonusClass ?? undefined,
      wantCollision: defaultValues?.wantCollision ?? true,
      wantThirdParty: defaultValues?.wantThirdParty ?? true,
      wantTheft: defaultValues?.wantTheft ?? true,
      wantGlass: defaultValues?.wantGlass ?? false,
      wantTow: defaultValues?.wantTow ?? true,
    },
  });

  const formData = watch();

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dados do Veiculo</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Marca *</Label>
          <Input {...register('vehicleMake')} placeholder="Ex: Toyota" />
          {errors.vehicleMake && <p className="text-sm text-destructive">{errors.vehicleMake.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Modelo *</Label>
          <Input {...register('vehicleModel')} placeholder="Ex: Corolla" />
          {errors.vehicleModel && <p className="text-sm text-destructive">{errors.vehicleModel.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Ano *</Label>
          <Input {...register('vehicleYear', { valueAsNumber: true })} type="number" placeholder="2024" />
          {errors.vehicleYear && <p className="text-sm text-destructive">{errors.vehicleYear.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Placa</Label>
          <Input {...register('plate')} placeholder="ABC1D23" />
        </div>
        <div className="space-y-2">
          <Label>Uso do Veiculo *</Label>
          <Select
            value={watch('vehicleUse')}
            onValueChange={(v) => setValue('vehicleUse', v as FormData['vehicleUse'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Particular</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="rideshare">App (Uber, 99...)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Garagem *</Label>
          <Select
            value={watch('garageType')}
            onValueChange={(v) => setValue('garageType', v as FormData['garageType'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="locked_garage">Garagem Fechada</SelectItem>
              <SelectItem value="covered">Coberta</SelectItem>
              <SelectItem value="street">Via Publica</SelectItem>
              <SelectItem value="condo">Condominio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Dados do Condutor Principal</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome do Motorista *</Label>
          <Input {...register('driverName')} placeholder="Nome completo" />
          {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data de Nascimento *</Label>
          <Input {...register('driverBirthDate')} type="date" />
          {errors.driverBirthDate && <p className="text-sm text-destructive">{errors.driverBirthDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Sexo *</Label>
          <Select
            value={watch('driverGender')}
            onValueChange={(v) => setValue('driverGender', v as FormData['driverGender'])}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Classe de Bonus (0-10)</Label>
          <Input {...register('bonusClass', { valueAsNumber: true })} type="number" min={0} max={10} placeholder="0" />
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Coberturas Desejadas</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantCollision"
            checked={watch('wantCollision')}
            onCheckedChange={(v) => setValue('wantCollision', !!v)}
          />
          <Label htmlFor="wantCollision">Colisao / Incendio</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantThirdParty"
            checked={watch('wantThirdParty')}
            onCheckedChange={(v) => setValue('wantThirdParty', !!v)}
          />
          <Label htmlFor="wantThirdParty">Danos a Terceiros</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantTheft"
            checked={watch('wantTheft')}
            onCheckedChange={(v) => setValue('wantTheft', !!v)}
          />
          <Label htmlFor="wantTheft">Roubo / Furto</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantGlass"
            checked={watch('wantGlass')}
            onCheckedChange={(v) => setValue('wantGlass', !!v)}
          />
          <Label htmlFor="wantGlass">Vidros</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wantTow"
            checked={watch('wantTow')}
            onCheckedChange={(v) => setValue('wantTow', !!v)}
          />
          <Label htmlFor="wantTow">Guincho / Assistencia</Label>
        </div>
      </div>
    </div>
  );
}
