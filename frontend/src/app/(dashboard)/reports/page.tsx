'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign, Building2, UserCheck, FileText,
  AlertTriangle, BarChart3,
} from 'lucide-react';
import Link from 'next/link';

const reports = [
  {
    title: 'Recebimentos Mensais',
    description: 'Todas as parcelas do mes com totais e status',
    icon: DollarSign,
    href: '/reports?type=monthly-receipts',
  },
  {
    title: 'Por Operadora',
    description: 'Recebimentos agrupados por operadora de seguros',
    icon: Building2,
    href: '/reports?type=by-insurer',
  },
  {
    title: 'Por Vendedor',
    description: 'Comissoes e producao por vendedor',
    icon: UserCheck,
    href: '/reports?type=by-seller',
  },
  {
    title: 'Apolices Ativas',
    description: 'Listagem completa de apolices ativas e vitalicias',
    icon: FileText,
    href: '/reports?type=active-policies',
  },
  {
    title: 'Inadimplencia',
    description: 'Parcelas atrasadas com dados de contato do cliente',
    icon: AlertTriangle,
    href: '/reports?type=overdue',
  },
  {
    title: 'Comissoes por Periodo',
    description: 'Comissao da corretora e dos vendedores por periodo',
    icon: BarChart3,
    href: '/reports?type=commissions-by-period',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatorios</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={report.href.replace('/reports?type=', '/reports/view?type=')}>
                  Gerar Relatorio
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
