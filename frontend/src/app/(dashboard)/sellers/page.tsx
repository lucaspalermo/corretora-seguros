'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Seller, PaginatedResponse } from '@/types/api.types';
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

export default function SellersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<Seller>>({
    queryKey: ['sellers', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const { data } = await api.get(`/sellers?${params}`);
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendedores</h1>
        <Button asChild>
          <Link href="/sellers/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Vendedor
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
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
                <TableHead>CPF</TableHead>
                <TableHead>Comissao Padrao</TableHead>
                <TableHead>Comissao Especial</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
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
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((seller) => (
                  <TableRow key={seller.id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => window.location.href = `/sellers/${seller.id}`}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell className="font-mono text-sm">{seller.cpf}</TableCell>
                    <TableCell>{seller.defaultCommissionPct}%</TableCell>
                    <TableCell>{seller.specialCommissionPct ? `${seller.specialCommissionPct}%` : '-'}</TableCell>
                    <TableCell>{seller.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={seller.status === 'active' ? 'default' : 'secondary'}>
                        {seller.status === 'active' ? 'Ativo' : 'Inativo'}
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
