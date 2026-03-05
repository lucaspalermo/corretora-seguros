export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

export interface Client {
  id: string;
  name: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  personType: 'pf' | 'pj';
  phone?: string;
  email?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Insurer {
  id: string;
  name: string;
  category: InsuranceCategory;
  defaultCommissionPct: number;
  paymentMethod?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Seller {
  id: string;
  name: string;
  cpf: string;
  defaultCommissionPct: number;
  specialCommissionPct?: number;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type InsuranceCategory = 'auto' | 'health' | 'life' | 'property' | 'business' | 'dental' | 'travel' | 'other';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled';
export type PolicyType = 'active' | 'lifetime' | 'cancelled';
export type PaymentMethod = 'boleto' | 'credit_card' | 'debit' | 'pix' | 'transfer';
export type ReceivableStatus = 'pending' | 'received' | 'overdue' | 'cancelled';

export interface Policy {
  id: string;
  clientId: string;
  insurerId: string;
  sellerId: string;
  policyNumber: string;
  category: InsuranceCategory;
  type: PolicyType;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  premiumCents: number;
  paymentMethod: PaymentMethod;
  installments: number;
  brokerCommissionPct: number;
  sellerCommissionPct: number;
  autoRenew: boolean;
  notes?: string;
  createdAt: string;
  client?: Client;
  insurer?: Insurer;
  seller?: Seller;
  receivables?: Receivable[];
}

export interface Receivable {
  id: string;
  policyId: string;
  clientId: string;
  installmentNumber: number;
  grossAmountCents: number;
  brokerCommissionCents: number;
  sellerCommissionCents: number;
  netAmountCents: number;
  dueDate: string;
  receivedDate?: string;
  status: ReceivableStatus;
  notes?: string;
  createdAt: string;
  client?: { id: string; name: string };
  policy?: { id: string; policyNumber: string };
}

export interface Quote {
  id: string;
  clientId: string;
  sellerId: string;
  title: string;
  category: InsuranceCategory;
  status: QuoteStatus;
  riskData: string;
  expiresAt?: string;
  acceptedAt?: string;
  acceptedItemId?: string;
  policyId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  items?: QuoteItem[];
  _count?: { items: number };
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  insurerId: string;
  premiumCents: number;
  installments: number;
  paymentMethod?: string;
  brokerCommissionPct: number;
  sellerCommissionPct: number;
  coverages: string;
  conditions: string;
  selected: boolean;
  proposalNumber?: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  insurer?: Insurer;
}

export interface DashboardStats {
  activePolicies: number;
  totalClients: number;
  overdueCount: number;
  policiesByCategory: Array<{ category: string; count: number }>;
  monthlyDueCents: number;
  monthlyReceivedCents: number;
  monthlyBrokerCommissionCents: number;
  monthlySellerCommissionCents: number;
}
