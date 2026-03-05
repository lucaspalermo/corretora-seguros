'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { clientsService } from '@/services/clients.service';
import { insurersService } from '@/services/insurers.service';
import { sellersService } from '@/services/sellers.service';

const schema = z.object({
  clientId: z.string().uuid('Selecione um cliente'),
  insurerId: z.string().uuid('Selecione uma operadora'),
  sellerId: z.string().uuid('Selecione um vendedor'),
  policyNumber: z.string().min(1, 'Numero da apolice obrigatorio'),
  category: z.enum(['auto', 'health', 'life', 'property', 'business', 'dental', 'travel', 'other']),
  startDate: z.string().min(1, 'Data de inicio obrigatoria'),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  premiumCents: z.number().min(1, 'Valor do premio obrigatorio'),
  paymentMethod: z.enum(['boleto', 'credit_card', 'debit', 'pix', 'transfer']),
  installments: z.number().int().min(1).max(60),
  brokerCommissionPct: z.number().min(0).max(100),
  sellerCommissionPct: z.number().min(0).max(100),
  autoRenew: z.boolean().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<any>;
  loading?: boolean;
}

export function PolicyForm({ initialData, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: initialData?.clientId || '',
      insurerId: initialData?.insurerId || '',
      sellerId: initialData?.sellerId || '',
      policyNumber: initialData?.policyNumber || '',
      category: initialData?.category || 'auto',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      renewalDate: initialData?.renewalDate || '',
      premiumCents: initialData?.premiumCents || 0,
      paymentMethod: initialData?.paymentMethod || 'boleto',
      installments: initialData?.installments || 1,
      brokerCommissionPct: initialData?.brokerCommissionPct || 0,
      sellerCommissionPct: initialData?.sellerCommissionPct || 0,
      autoRenew: initialData?.autoRenew || false,
      notes: initialData?.notes || '',
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsService.list({ limit: 200 }),
  });

  const { data: insurers } = useQuery({
    queryKey: ['insurers-select'],
    queryFn: () => insurersService.list({ limit: 200 }),
  });

  const { data: sellers } = useQuery({
    queryKey: ['sellers-select'],
    queryFn: () => sellersService.list({ limit: 200 }),
  });

  // Quando selecionar operadora, preencher comissao padrao
  const selectedInsurerId = watch('insurerId');
  const selectedInsurer = insurers?.data.find((i) => i.id === selectedInsurerId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente *</Label>
          <Select value={watch('clientId')} onValueChange={(v) => setValue('clientId', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
            <SelectContent>
              {clients?.data.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Numero da Apolice *</Label>
          <Input {...register('policyNumber')} placeholder="APL-2026-001" />
          {errors.policyNumber && (
            <p className="text-sm text-destructive">{errors.policyNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Operadora *</Label>
          <Select
            value={watch('insurerId')}
            onValueChange={(v) => {
              setValue('insurerId', v);
              const ins = insurers?.data.find((i) => i.id === v);
              if (ins) setValue('brokerCommissionPct', Number(ins.defaultCommissionPct));
            }}
          >
            <SelectTrigger><SelectValue placeholder="Selecione a operadora" /></SelectTrigger>
            <SelectContent>
              {insurers?.data.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name} ({i.category})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.insurerId && <p className="text-sm text-destructive">{errors.insurerId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Vendedor *</Label>
          <Select
            value={watch('sellerId')}
            onValueChange={(v) => {
              setValue('sellerId', v);
              const sel = sellers?.data.find((s) => s.id === v);
              if (sel) setValue('sellerCommissionPct', Number(sel.defaultCommissionPct));
            }}
          >
            <SelectTrigger><SelectValue placeholder="Selecione o vendedor" /></SelectTrigger>
            <SelectContent>
              {sellers?.data.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sellerId && <p className="text-sm text-destructive">{errors.sellerId.message}</p>}
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
          <Label>Forma de Pagamento *</Label>
          <Select value={watch('paymentMethod')} onValueChange={(v: any) => setValue('paymentMethod', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="credit_card">Cartao de Credito</SelectItem>
              <SelectItem value="debit">Debito</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Datas e Valores</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Data de Inicio *</Label>
          <Input type="date" {...register('startDate')} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data de Vigencia</Label>
          <Input type="date" {...register('endDate')} />
        </div>
        <div className="space-y-2">
          <Label>Data de Renovacao</Label>
          <Input type="date" {...register('renewalDate')} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Valor do Premio (centavos) *</Label>
          <Input
            type="number"
            min="1"
            {...register('premiumCents', { valueAsNumber: true })}
            placeholder="120000 = R$ 1.200,00"
          />
          {errors.premiumCents && (
            <p className="text-sm text-destructive">{errors.premiumCents.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Parcelas *</Label>
          <Input
            type="number"
            min="1"
            max="60"
            {...register('installments', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>Comissao Corretora (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('brokerCommissionPct', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>Comissao Vendedor (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('sellerCommissionPct', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="autoRenew" {...register('autoRenew')} className="rounded" />
        <Label htmlFor="autoRenew">Renovacao automatica</Label>
      </div>

      <div className="space-y-2">
        <Label>Observacoes</Label>
        <textarea
          {...register('notes')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Observacoes sobre a apolice..."
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar Apolice'}
        </Button>
      </div>
    </form>
  );
}
