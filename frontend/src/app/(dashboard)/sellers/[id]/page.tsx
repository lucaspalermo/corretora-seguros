'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellersService } from '@/services/sellers.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellersService.get(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => sellersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      router.push('/sellers');
    },
  });

  if (isLoading) return <div className="animate-pulse"><div className="h-64 bg-muted rounded" /></div>;
  if (!seller) return <p>Vendedor nao encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sellers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{seller.name}</h1>
          <Badge variant={seller.status === 'active' ? 'default' : 'secondary'}>
            {seller.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/sellers/${id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
          </Button>
          <Button variant="destructive" onClick={() => {
            if (confirm('Deseja inativar este vendedor?')) deleteMutation.mutate();
          }}>
            <Trash2 className="mr-2 h-4 w-4" />Inativar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informacoes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">CPF</span><span className="font-mono">{seller.cpf}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Comissao Padrao</span><span>{Number(seller.defaultCommissionPct)}%</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Comissao Diferenciada</span><span>{seller.specialCommissionPct ? `${Number(seller.specialCommissionPct)}%` : '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Apolices</span><span>{(seller as any)._count?.policies || 0}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{seller.phone || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{seller.email || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Acesso ao sistema</span><span>{(seller as any).user ? 'Sim' : 'Nao'}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
