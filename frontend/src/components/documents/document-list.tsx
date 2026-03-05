'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Trash2, Upload, Download, Image, File } from 'lucide-react';

interface DocumentItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  category: string;
  notes?: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  proposal: 'Proposta',
  policy_doc: 'Apolice',
  receipt: 'Comprovante',
  id_doc: 'Documento',
  other: 'Outro',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
}

interface DocumentListProps {
  entity: string;
  entityId: string;
}

export function DocumentList({ entity, entityId }: DocumentListProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');

  const { data: documents = [], isLoading } = useQuery<DocumentItem[]>({
    queryKey: ['documents', entity, entityId],
    queryFn: async () => {
      const { data } = await api.get(
        `/documents?entity=${entity}&entityId=${entityId}`,
      );
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity', entity);
      formData.append('entityId', entityId);
      formData.append('category', category);
      if (notes) formData.append('notes', notes);
      const { data } = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents', entity, entityId],
      });
      setFile(null);
      setNotes('');
      setCategory('other');
      // Limpar o input de arquivo
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents', entity, entityId],
      });
    },
  });

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
    'http://localhost:3001';

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-sm font-medium">Enviar Documento</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="policy_doc">Apolice</SelectItem>
                <SelectItem value="receipt">Comprovante</SelectItem>
                <SelectItem value="id_doc">Documento</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Documents list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse bg-muted rounded" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum documento
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.mimeType);
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.originalName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[doc.category] || doc.category}
                      </Badge>
                      <span>{formatFileSize(doc.sizeBytes)}</span>
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(`${apiBase}${doc.url}`, '_blank')
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Remover documento?'))
                        deleteMutation.mutate(doc.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
