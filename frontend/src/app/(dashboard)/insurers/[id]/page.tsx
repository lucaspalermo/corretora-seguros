'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insurersService } from '@/services/insurers.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { categoryLabels, formatDate } from '@/lib/format';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function InsurerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: insurer, isLoading } = useQuery({
    queryKey: ['insurer', id],
    queryFn: () => insurersService.get(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => insurersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
      router.push('/insurers');
    },
  });

  if (isLoading) return <div className="animate-pulse"><div className="h-64 bg-muted rounded" /></div>;
  if (!insurer) return <p>Operadora nao encontrada</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/insurers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{insurer.name}</h1>
          <Badge variant={insurer.status === 'active' ? 'default' : 'secondary'}>
            {insurer.status === 'active' ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/insurers/${id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
          </Button>
          <Button variant="destructive" onClick={() => {
            if (confirm('Deseja inativar esta operadora?')) deleteMutation.mutate();
          }}>
            <Trash2 className="mr-2 h-4 w-4" />Inativar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informacoes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{categoryLabels[insurer.category]}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Comissao Padrao</span><span>{Number(insurer.defaultCommissionPct)}%</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Forma de Repasse</span><span>{insurer.paymentMethod || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Apolices</span><span>{(insurer as any)._count?.policies || 0}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span>{insurer.contactName || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{insurer.contactPhone || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{insurer.contactEmail || '-'}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
