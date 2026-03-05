'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';

function formatDate(date: string) {
  return new Date(date).toLocaleString('pt-BR');
}

const methodColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  POST: 'default', PUT: 'secondary', PATCH: 'outline', DELETE: 'destructive',
};

interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, methodFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (methodFilter && methodFilter !== 'all') params.set('method', methodFilter);
      params.set('limit', '100');
      const { data } = await api.get(`/audit?${params}`);
      return data;
    },
  });

  const logs: AuditLog[] = data?.data || data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Auditoria</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Logs de Atividade</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por caminho ou usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Metodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead>Caminho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}><div className="h-4 animate-pulse bg-muted rounded w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.userName || log.userId}</TableCell>
                    <TableCell>
                      <Badge variant={methodColors[log.method] || 'outline'}>{log.method}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[300px] truncate">{log.path}</TableCell>
                    <TableCell>
                      <Badge variant={log.statusCode >= 400 ? 'destructive' : 'default'}>
                        {log.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ip || '-'}</TableCell>
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
