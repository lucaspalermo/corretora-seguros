'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Insurer, PaginatedResponse } from '@/types/api.types';
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

export default function InsurersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<Insurer>>({
    queryKey: ['insurers', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const { data } = await api.get(`/insurers?${params}`);
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Operadoras</h1>
        <Button asChild>
          <Link href="/insurers/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Operadora
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Comissao Padrao</TableHead>
                <TableHead>Forma de Repasse</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse bg-muted rounded w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma operadora encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((insurer) => (
                  <TableRow key={insurer.id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => window.location.href = `/insurers/${insurer.id}`}>
                    <TableCell className="font-medium">{insurer.name}</TableCell>
                    <TableCell>{categoryLabels[insurer.category] || insurer.category}</TableCell>
                    <TableCell>{insurer.defaultCommissionPct}%</TableCell>
                    <TableCell>{insurer.paymentMethod || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={insurer.status === 'active' ? 'default' : 'secondary'}>
                        {insurer.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
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
