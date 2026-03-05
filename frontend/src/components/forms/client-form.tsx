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
import type { Client } from '@/types/api.types';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  document: z.string().min(11, 'Documento invalido'),
  documentType: z.enum(['cpf', 'cnpj']),
  personType: z.enum(['pf', 'pj']),
  phone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().max(2).optional(),
  addressZip: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Partial<Client>;
  onSubmit: (data: FormData) => Promise<any>;
  loading?: boolean;
}

export function ClientForm({ initialData, onSubmit, loading }: Props) {
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
      document: initialData?.document || '',
      documentType: initialData?.documentType || 'cpf',
      personType: initialData?.personType || 'pf',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      addressStreet: initialData?.addressStreet || '',
      addressNumber: initialData?.addressNumber || '',
      addressComplement: initialData?.addressComplement || '',
      addressNeighborhood: initialData?.addressNeighborhood || '',
      addressCity: initialData?.addressCity || '',
      addressState: initialData?.addressState || '',
      addressZip: initialData?.addressZip || '',
      notes: initialData?.notes || '',
    },
  });

  const personType = watch('personType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome / Razao Social *</Label>
          <Input {...register('name')} placeholder="Nome completo" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tipo de Pessoa *</Label>
          <Select
            value={personType}
            onValueChange={(v: 'pf' | 'pj') => {
              setValue('personType', v);
              setValue('documentType', v === 'pf' ? 'cpf' : 'cnpj');
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pf">Pessoa Fisica</SelectItem>
              <SelectItem value="pj">Pessoa Juridica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{personType === 'pf' ? 'CPF' : 'CNPJ'} *</Label>
          <Input
            {...register('document')}
            placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0001-00'}
          />
          {errors.document && <p className="text-sm text-destructive">{errors.document.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input {...register('phone')} placeholder="(00) 00000-0000" />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register('email')} type="email" placeholder="email@exemplo.com" />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Endereco</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Rua</Label>
          <Input {...register('addressStreet')} placeholder="Rua, Avenida..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Numero</Label>
            <Input {...register('addressNumber')} placeholder="123" />
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input {...register('addressComplement')} placeholder="Apto, Sala..." />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input {...register('addressNeighborhood')} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Cidade</Label>
            <Input {...register('addressCity')} />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Input {...register('addressState')} placeholder="SP" maxLength={2} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>CEP</Label>
          <Input {...register('addressZip')} placeholder="00000-000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observacoes</Label>
        <textarea
          {...register('notes')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Observacoes sobre o cliente..."
        />
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
