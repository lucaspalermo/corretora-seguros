'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ImportResult {
  imported: number;
  errors: string[];
}

export default function ImportPage() {
  const router = useRouter();
  const [clientFile, setClientFile] = useState<File | null>(null);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [clientResult, setClientResult] = useState<ImportResult | null>(null);
  const [policyResult, setPolicyResult] = useState<ImportResult | null>(null);

  const clientImport = useMutation({
    mutationFn: async () => {
      if (!clientFile) return;
      const formData = new FormData();
      formData.append('file', clientFile);
      const { data } = await api.post('/import/clients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data as ImportResult;
    },
    onSuccess: (data) => {
      if (data) setClientResult(data);
      setClientFile(null);
    },
  });

  const policyImport = useMutation({
    mutationFn: async () => {
      if (!policyFile) return;
      const formData = new FormData();
      formData.append('file', policyFile);
      const { data } = await api.post('/import/policies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data as ImportResult;
    },
    onSuccess: (data) => {
      if (data) setPolicyResult(data);
      setPolicyFile(null);
    },
  });

  async function downloadTemplate(type: 'clients' | 'policies') {
    const { data } = await api.get(`/import/templates/${type}`, {
      responseType: 'blob',
    });
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type === 'clients' ? 'clientes' : 'apolices'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function renderResult(result: ImportResult | null) {
    if (!result) return null;
    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{result.imported} importados</Badge>
          {result.errors.length > 0 && (
            <Badge variant="destructive">{result.errors.length} erros</Badge>
          )}
        </div>
        {result.errors.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded border p-3 text-sm space-y-1">
            {result.errors.map((err, i) => (
              <p key={i} className="text-destructive">
                {err}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Importar Dados</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Clientes
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate('clients')}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie um arquivo CSV ou Excel com as colunas: nome, documento,
            telefone, email, endereco, cidade, estado, cep
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setClientFile(e.target.files?.[0] || null)}
            />
            <Button
              onClick={() => clientImport.mutate()}
              disabled={!clientFile || clientImport.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {clientImport.isPending ? 'Importando...' : 'Importar'}
            </Button>
          </div>
          {renderResult(clientResult)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Apolices
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate('policies')}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie um arquivo CSV ou Excel com as colunas: numero,
            documento_cliente, operadora, vendedor, categoria, premio, inicio,
            fim, parcelas, pagamento, comissao_corretora, comissao_vendedor
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
            />
            <Button
              onClick={() => policyImport.mutate()}
              disabled={!policyFile || policyImport.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {policyImport.isPending ? 'Importando...' : 'Importar'}
            </Button>
          </div>
          {renderResult(policyResult)}
        </CardContent>
      </Card>
    </div>
  );
}
