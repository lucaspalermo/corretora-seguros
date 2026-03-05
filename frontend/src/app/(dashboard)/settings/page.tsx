'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Trash2, Save, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

const roleLabels: Record<string, string> = {
  admin: 'Administrador', financial: 'Financeiro',
  seller: 'Vendedor', viewer: 'Visualizador',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Usuarios
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Empresa
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');
  const [companyError, setCompanyError] = useState('');

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const { data } = await api.get('/tenant');
      return data;
    },
  });

  useEffect(() => {
    if (tenant) {
      setCompanyName(tenant.name || '');
      setCompanyDocument(tenant.document || '');
      const settings = tenant.settings || {};
      setCompanyPhone(settings.companyPhone || '');
      setCompanyEmail(settings.companyEmail || '');
    }
  }, [tenant]);

  const createUserMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string; role: string }) => {
      const { data } = await api.post('/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('viewer');
      setError('');
      setSuccess('Usuario criado com sucesso');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao criar usuario');
      setSuccess('');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (payload: { name: string; document: string; phone: string; email: string }) => {
      const { data } = await api.patch('/tenant', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      setCompanyError('');
      setCompanySuccess('Dados salvos com sucesso');
      setTimeout(() => setCompanySuccess(''), 3000);
    },
    onError: (err: any) => {
      setCompanyError(err.response?.data?.message || 'Erro ao salvar dados');
      setCompanySuccess('');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createUserMutation.mutate({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
    });
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    updateTenantMutation.mutate({
      name: companyName,
      document: companyDocument,
      phone: companyPhone,
      email: companyEmail,
    });
  };

  const userList = Array.isArray(users) ? users : users?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuracoes</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Novo Usuario</CardTitle>
              <CardDescription>Adicione usuarios ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</div>}
              {success && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">{success}</div>}
              <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Senha</Label>
                  <Input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-1">
                  <Label>Perfil</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="financial">Financeiro</SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={createUserMutation.isPending} className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />Criar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usuarios do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(5)].map((_, j) => (
                          <TableCell key={j}><div className="h-4 animate-pulse bg-muted rounded w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : userList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum usuario encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    userList.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{roleLabels[u.role] || u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>
                            {u.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.id !== user?.id && (
                            <Button size="sm" variant="ghost"
                              onClick={() => { if (confirm('Deseja remover este usuario?')) deleteUserMutation.mutate(u.id); }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacoes da Empresa</CardTitle>
              <CardDescription>Dados da corretora de seguros</CardDescription>
            </CardHeader>
            <CardContent>
              {companyError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{companyError}</div>}
              {companySuccess && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">{companySuccess}</div>}
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Nome da Empresa</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nome da corretora" />
                  </div>
                  <div className="space-y-1">
                    <Label>CNPJ</Label>
                    <Input value={companyDocument} onChange={(e) => setCompanyDocument(e.target.value)}
                      placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="(00) 0000-0000" />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="contato@corretora.com" />
                  </div>
                </div>
                {tenant?.plan && (
                  <>
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                      <strong>Plano:</strong> {tenant.plan.name} &middot;
                      Max {tenant.plan.maxUsers} usuarios &middot;
                      Max {tenant.plan.maxPolicies} apolices
                    </div>
                  </>
                )}
                <Separator />
                <Button type="submit" disabled={updateTenantMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateTenantMutation.isPending ? 'Salvando...' : 'Salvar Alteracoes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importar Dados
              </CardTitle>
              <CardDescription>
                Importe clientes e apolices via planilha CSV ou Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/import">
                <Button variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Acessar Importacao
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
