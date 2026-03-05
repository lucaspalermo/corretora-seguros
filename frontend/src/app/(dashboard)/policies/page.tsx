'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Policy, PaginatedResponse } from '@/types/api.types';
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

const categoryLabels: Record<string, string> = {
  auto: 'Auto', health: 'Saude', life: 'Vida',
  business: 'Empresarial', other: 'Outros',
};

const typeLabels: Record<string, string> = {
  active: 'Ativa', lifetime: 'Vitalicia', cancelled: 'Cancelada',
};

const typeVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default', lifetime: 'secondary', cancelled: 'destructive',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export default function PoliciesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<Policy>>({
    queryKey: ['policies', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const { data } = await api.get(`/policies?${params}`);
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Apolices</h1>
        <Button asChild>
          <Link href="/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Apolice
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por numero ou cliente..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Badge variant="secondary">{data?.meta.total || 0} apolices</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Premio</TableHead>
                <TableHead>Vendedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse bg-muted rounded w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma apolice encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((policy) => (
                  <TableRow key={policy.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/policies/${policy.id}`} className="font-medium font-mono hover:underline">
                        {policy.policyNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{policy.client?.name || '-'}</TableCell>
                    <TableCell>{policy.insurer?.name || '-'}</TableCell>
                    <TableCell>{categoryLabels[policy.category] || policy.category}</TableCell>
                    <TableCell>
                      <Badge variant={typeVariants[policy.type] || 'default'}>
                        {typeLabels[policy.type] || policy.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(policy.premiumCents)}</TableCell>
                    <TableCell>{policy.seller?.name || '-'}</TableCell>
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
