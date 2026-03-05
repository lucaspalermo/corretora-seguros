export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function centsToReal(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function realToCents(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100);
}

export const categoryLabels: Record<string, string> = {
  auto: 'Auto', health: 'Saude', life: 'Vida',
  property: 'Residencial', business: 'Empresarial',
  dental: 'Odonto', travel: 'Viagem', other: 'Outros',
};

export const policyTypeLabels: Record<string, string> = {
  active: 'Ativa', lifetime: 'Vitalicia', cancelled: 'Cancelada',
};

export const paymentMethodLabels: Record<string, string> = {
  boleto: 'Boleto', credit_card: 'Cartao de Credito',
  debit: 'Debito', pix: 'PIX', transfer: 'Transferencia',
};

export const receivableStatusLabels: Record<string, string> = {
  pending: 'Em Aberto', received: 'Recebido',
  overdue: 'Atrasado', cancelled: 'Cancelado',
};
