'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Building2, UserCheck,
  FileText, DollarSign, BarChart3, Settings, Shield, Calculator,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Operadoras', href: '/insurers', icon: Building2 },
  { name: 'Vendedores', href: '/sellers', icon: UserCheck },
  { name: 'Apolices', href: '/policies', icon: FileText },
  { name: 'Multicalculo', href: '/quotes', icon: Calculator },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Relatorios', href: '/reports', icon: BarChart3 },
  { name: 'Auditoria', href: '/audit', icon: Shield, roles: ['admin'] },
  { name: 'Configuracoes', href: '/settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-background">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">SeguraSaaS</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
