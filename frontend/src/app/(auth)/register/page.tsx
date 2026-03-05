'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no minimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        companyName,
      });

      // Login automatico apos registro
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('tenantId', data.user.tenantId);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Criar Conta</CardTitle>
        <CardDescription>Cadastre sua corretora no SeguraSaaS</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Corretora</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Minha Corretora de Seguros" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Seu Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Conta'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ja possui conta?{' '}
            <Link href="/login" className="text-primary hover:underline">Fazer login</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
