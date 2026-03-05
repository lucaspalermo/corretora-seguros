'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quotesService } from '@/services/quotes.service';
import type { Quote, PaginatedResponse } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const categoryLabels: Record<string, string> = {
  auto: 'Auto',
  health: 'Saude',
  life: 'Vida',
  property: 'Residencial',
  business: 'Empresarial',
  dental: 'Odonto',
  travel: 'Viagem',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  accepted: 'Aceita',
  expired: 'Expirada',
  cancelled: 'Cancelada',
};

const statusVariants: Record<string, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  draft: 'outline',
  sent: 'secondary',
  accepted: 'default',
  expired: 'destructive',
  cancelled: 'destructive',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function QuotesPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const { data, isLoading } = useQuery<PaginatedResponse<Quote>>({
    queryKey: ['quotes', search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      return quotesService.list(params);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Multicalculo</h1>
        <Button asChild>
          <Link href="/quotes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Cotacao
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por titulo ou cliente..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Badge variant="secondary">{data?.meta.total || 0} cotacoes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse bg-muted rounded w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma cotacao encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    <TableCell className="font-medium">{quote.title}</TableCell>
                    <TableCell>{quote.client?.name || '-'}</TableCell>
                    <TableCell>{categoryLabels[quote.category] || quote.category}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[quote.status] || 'outline'}>
                        {statusLabels[quote.status] || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{quote._count?.items ?? 0}</TableCell>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
