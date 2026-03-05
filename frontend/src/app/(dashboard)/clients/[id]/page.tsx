'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/clients.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, ArrowLeft, LinkIcon, Copy } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { DocumentList } from '@/components/documents/document-list';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.get(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push('/clients');
    },
  });

  const [portalOpen, setPortalOpen] = useState(false);
  const [portalLink, setPortalLink] = useState('');

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/client-portal/generate/${id}`);
      return data;
    },
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      setPortalLink(`${baseUrl}/portal/${data.token}`);
      setPortalOpen(true);
    },
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="h-64 bg-muted rounded" /></div>;
  }

  if (!client) return <p>Cliente nao encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.document}</p>
          </div>
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            {portalMutation.isPending ? 'Gerando...' : 'Link Portal'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />Editar
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Deseja inativar este cliente?')) deleteMutation.mutate();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />Inativar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informacoes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{client.personType === 'pf' ? 'Pessoa Fisica' : 'Pessoa Juridica'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{client.phone || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{client.email || '-'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Cadastro</span><span>{formatDate(client.createdAt)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Endereco</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {client.addressStreet ? (
              <p>
                {client.addressStreet}, {client.addressNumber}
                {client.addressComplement && ` - ${client.addressComplement}`}<br />
                {client.addressNeighborhood && `${client.addressNeighborhood} - `}
                {client.addressCity}/{client.addressState}<br />
                CEP: {client.addressZip}
              </p>
            ) : (
              <p className="text-muted-foreground">Endereco nao informado</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Apolices ({client._count?.policies || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.policies && client.policies.length > 0 ? (
              <div className="space-y-2">
                {client.policies.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/policies/${p.id}`}
                    className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50"
                  >
                    <div>
                      <span className="font-mono font-medium">{p.policyNumber}</span>
                      <span className="ml-2 text-muted-foreground text-sm">{p.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatCurrency(p.premiumCents)}</span>
                      <Badge variant={p.type === 'active' ? 'default' : p.type === 'cancelled' ? 'destructive' : 'secondary'}>
                        {p.type}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma apolice vinculada</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Documentos</CardTitle></CardHeader>
        <CardContent>
          <DocumentList entity="client" entityId={id} />
        </CardContent>
      </Card>

      {client.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observacoes</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{client.notes}</p></CardContent>
        </Card>
      )}

      {/* Portal Link Dialog */}
      <Dialog open={portalOpen} onOpenChange={setPortalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link do Portal do Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com o cliente para que ele acesse suas apolices e parcelas. Valido por 30 dias.
            </p>
            <div className="flex items-center gap-2">
              <Input value={portalLink} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(portalLink);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
