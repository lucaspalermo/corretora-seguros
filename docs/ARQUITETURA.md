# Arquitetura do Sistema - Corretora de Seguros SaaS

## 1. Visao Geral da Stack

| Camada       | Tecnologia                  | Justificativa                                        |
|--------------|-----------------------------|------------------------------------------------------|
| Frontend     | Next.js 14 (App Router)     | SSR, RSC, performance, SEO, deploy Vercel            |
| UI           | shadcn/ui + Tailwind CSS    | Componentes acessiveis, customizaveis, sem lock-in   |
| Backend      | NestJS 10 + TypeScript      | Modular, DI nativo, guards, interceptors, escalavel  |
| ORM          | Prisma 5                    | Type-safe, migrations, introspection, multi-schema   |
| Banco        | PostgreSQL 16               | JSONB, RLS, partitioning, extensoes, ACID            |
| Cache        | Redis 7                     | Sessions, rate-limiting, filas, cache de queries      |
| Fila         | BullMQ (sobre Redis)        | Jobs assincrónos (emails, relatorios, renovacoes)    |
| Auth         | JWT (access) + Refresh Token| Stateless, rotacao de tokens, revogacao via Redis     |
| Storage      | S3-compatible (MinIO/AWS)   | Documentos de apolices, comprovantes                 |
| Email        | Resend ou AWS SES           | Alertas, notificacoes, relatorios                    |
| Logs         | Pino + PostgreSQL (audit)   | Structured logging + audit trail persistente         |
| Monitoramento| Sentry + Prometheus/Grafana | Erros, metricas, alertas                             |
| Deploy       | Docker + AWS ECS ou Vercel  | Backend em containers, frontend em edge              |

---

## 2. Estrategia Multi-Tenant

### Modelo escolhido: Schema por tenant (PostgreSQL schemas)

```
database: corretora_saas
  ├── schema: public        (tabelas compartilhadas: tenants, plans, billing)
  ├── schema: tenant_abc123 (dados da corretora ABC)
  ├── schema: tenant_def456 (dados da corretora DEF)
  └── schema: tenant_ghi789 (dados da corretora GHI)
```

**Por que schema-per-tenant?**
- Isolamento forte de dados (compliance LGPD)
- Facilita backup/restore por corretora
- Permite migracoes graduais
- Performance: indices e queries isolados por schema
- Possibilidade futura de migrar tenant grande para DB dedicado

**Fluxo de resolucao do tenant:**
```
Request → Header X-Tenant-ID → Middleware → Prisma.$executeRaw('SET search_path TO tenant_xxx')
                                          → Ou PrismaClient por tenant (connection pool)
```

**Alternativa simplificada (fase 1):**
Se preferir comecar mais simples, usar coluna `tenant_id` em todas as tabelas com Row Level Security (RLS) do PostgreSQL. Migrar para schema-per-tenant quando atingir ~50 tenants.

### Provisioning de novo tenant:
1. Criar registro na tabela `public.tenants`
2. Criar schema `tenant_{id}`
3. Executar migrations do Prisma nesse schema
4. Criar usuario admin do tenant
5. Configurar plano/billing

---

## 3. Modelagem do Banco de Dados

### 3.1 Schema Public (compartilhado)

```
tenants
  id              UUID PK
  name            VARCHAR(255)        -- Nome da corretora
  slug            VARCHAR(100) UNIQUE -- Subdominio: abc.corretora.com
  document        VARCHAR(18)         -- CNPJ
  schema_name     VARCHAR(100)        -- tenant_abc123
  plan_id         UUID FK → plans
  status          ENUM(active, suspended, cancelled)
  settings        JSONB               -- Config customizada
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

plans
  id              UUID PK
  name            VARCHAR(100)
  max_users       INT
  max_policies    INT
  max_storage_mb  INT
  price_cents     INT
  billing_cycle   ENUM(monthly, yearly)
  features        JSONB
  status          ENUM(active, inactive)
  created_at      TIMESTAMPTZ
```

### 3.2 Schema do Tenant (replicado por corretora)

```
users
  id              UUID PK
  tenant_id       UUID                -- Redundante para RLS/seguranca
  name            VARCHAR(255)
  email           VARCHAR(255) UNIQUE
  password_hash   VARCHAR(255)
  cpf             VARCHAR(14)
  role            ENUM(admin, financial, seller, viewer)
  status          ENUM(active, inactive, blocked)
  last_login_at   TIMESTAMPTZ
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

clients
  id              UUID PK
  tenant_id       UUID
  name            VARCHAR(255)        -- Nome / Razao Social
  document        VARCHAR(18)         -- CPF ou CNPJ
  document_type   ENUM(cpf, cnpj)
  person_type     ENUM(pf, pj)
  phone           VARCHAR(20)
  email           VARCHAR(255)
  address_street  VARCHAR(255)
  address_number  VARCHAR(20)
  address_complement VARCHAR(100)
  address_neighborhood VARCHAR(100)
  address_city    VARCHAR(100)
  address_state   CHAR(2)
  address_zip     VARCHAR(10)
  status          ENUM(active, inactive)
  notes           TEXT
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

  INDEX: (document)
  INDEX: (name)
  INDEX: (status)

insurers (operadoras)
  id              UUID PK
  tenant_id       UUID
  name            VARCHAR(255)
  category        ENUM(auto, health, life, business, other)
  default_commission_pct  DECIMAL(5,2)  -- % padrao comissao corretora
  payment_method  VARCHAR(100)          -- Forma de repasse
  contact_name    VARCHAR(255)
  contact_phone   VARCHAR(20)
  contact_email   VARCHAR(255)
  status          ENUM(active, inactive)
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

  INDEX: (category)
  INDEX: (status)

sellers (vendedores)
  id              UUID PK
  tenant_id       UUID
  user_id         UUID FK → users (nullable, se vendedor tiver acesso ao sistema)
  name            VARCHAR(255)
  cpf             VARCHAR(14)
  default_commission_pct  DECIMAL(5,2)  -- % padrao do vendedor
  special_commission_pct  DECIMAL(5,2)  -- % diferenciado
  phone           VARCHAR(20)
  email           VARCHAR(255)
  status          ENUM(active, inactive)
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

  INDEX: (cpf)
  INDEX: (status)

policies (apolices)
  id              UUID PK
  tenant_id       UUID
  client_id       UUID FK → clients
  insurer_id      UUID FK → insurers
  seller_id       UUID FK → sellers
  policy_number   VARCHAR(100)
  category        ENUM(auto, health, life, business, other)
  type            ENUM(active, lifetime, cancelled)
  start_date      DATE
  end_date        DATE                  -- Vigencia
  renewal_date    DATE
  premium_cents   INT                   -- Valor do premio em centavos
  payment_method  ENUM(boleto, credit_card, debit, pix, transfer)
  installments    INT
  broker_commission_pct   DECIMAL(5,2)  -- % comissao corretora nesta apolice
  seller_commission_pct   DECIMAL(5,2)  -- % comissao vendedor nesta apolice
  auto_renew      BOOLEAN DEFAULT false
  notes           TEXT
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
  cancelled_at    TIMESTAMPTZ

  INDEX: (policy_number)
  INDEX: (client_id)
  INDEX: (insurer_id)
  INDEX: (seller_id)
  INDEX: (category, type)
  INDEX: (end_date)       -- Para alertas de vencimento
  INDEX: (renewal_date)   -- Para renovacoes automaticas

receivables (contas a receber / parcelas)
  id              UUID PK
  tenant_id       UUID
  policy_id       UUID FK → policies
  client_id       UUID FK → clients     -- Denormalizado para queries rapidas
  installment_number INT
  gross_amount_cents    INT             -- Valor bruto
  broker_commission_cents INT           -- Comissao corretora
  seller_commission_cents INT           -- Comissao vendedor
  net_amount_cents      INT             -- Valor liquido
  due_date        DATE
  received_date   DATE
  status          ENUM(pending, received, overdue, cancelled)
  payment_proof_url VARCHAR(500)        -- Comprovante (S3)
  notes           TEXT
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

  INDEX: (policy_id)
  INDEX: (client_id)
  INDEX: (due_date, status)  -- Consultas de vencimento/inadimplencia
  INDEX: (status)
  INDEX: (received_date)     -- Relatorios mensais

commission_payments (pagamentos de comissao a vendedores)
  id              UUID PK
  tenant_id       UUID
  seller_id       UUID FK → sellers
  receivable_id   UUID FK → receivables
  amount_cents    INT
  paid_date       DATE
  status          ENUM(pending, paid, cancelled)
  created_at      TIMESTAMPTZ

  INDEX: (seller_id, paid_date)

audit_logs
  id              UUID PK
  tenant_id       UUID
  user_id         UUID FK → users
  action          VARCHAR(50)           -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
  entity          VARCHAR(50)           -- policy, client, receivable, etc.
  entity_id       UUID
  old_values      JSONB                 -- Snapshot antes
  new_values      JSONB                 -- Snapshot depois
  ip_address      INET
  user_agent      VARCHAR(500)
  created_at      TIMESTAMPTZ

  INDEX: (entity, entity_id)
  INDEX: (user_id)
  INDEX: (created_at)
  -- Particionar por mes (created_at) quando volume crescer

notifications
  id              UUID PK
  tenant_id       UUID
  user_id         UUID FK → users (destinatario)
  type            ENUM(renewal, overdue, system, report)
  title           VARCHAR(255)
  message         TEXT
  read            BOOLEAN DEFAULT false
  entity          VARCHAR(50)
  entity_id       UUID
  created_at      TIMESTAMPTZ

  INDEX: (user_id, read)

refresh_tokens
  id              UUID PK
  user_id         UUID FK → users
  token_hash      VARCHAR(255)
  expires_at      TIMESTAMPTZ
  revoked         BOOLEAN DEFAULT false
  created_at      TIMESTAMPTZ

  INDEX: (token_hash)
  INDEX: (user_id)
```

### 3.3 Diagrama de Relacionamentos

```
tenants 1──N users
tenants 1──N clients
tenants 1──N insurers
tenants 1──N sellers
tenants 1──1 plans

clients   1──N policies
insurers  1──N policies
sellers   1──N policies

policies  1──N receivables
sellers   1──N commission_payments
receivables 1──N commission_payments

users     1──N audit_logs
users     1──N notifications
sellers   0──1 users (vendedor pode ter login)
```

---

## 4. Estrategia de Permissoes (RBAC)

### Roles e permissoes:

| Recurso            | Admin | Financial | Seller      | Viewer |
|--------------------|-------|-----------|-------------|--------|
| Dashboard          | Full  | Full      | Own data    | Read   |
| Clientes           | CRUD  | Read      | Own clients | Read   |
| Operadoras         | CRUD  | Read      | Read        | Read   |
| Vendedores         | CRUD  | Read      | Own profile | -      |
| Apolices           | CRUD  | Read+Edit | Own policies| Read   |
| Financeiro         | Full  | Full      | Own commiss.| Read   |
| Relatorios         | Full  | Full      | Own data    | Read   |
| Config. Corretora  | Full  | -         | -           | -      |
| Usuarios           | CRUD  | -         | -           | -      |
| Audit Logs         | Read  | Read      | -           | -      |

### Implementacao NestJS:

```typescript
// Guard customizado com decorator
@Roles('admin', 'financial')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Get('receivables')
async listReceivables() { ... }

// Para filtro por vendedor
@UseGuards(JwtAuthGuard, OwnershipGuard)
@Get('policies')
async listPolicies(@CurrentUser() user) {
  // Se role === 'seller', filtra por seller_id automaticamente
}
```

---

## 5. Estrategia de Seguranca

### 5.1 Autenticacao

```
Login → Valida credenciais → Gera Access Token (15min) + Refresh Token (7d)
                           → Armazena refresh_token hash no banco
                           → Retorna tokens + user info

Refresh → Valida refresh token → Revoga token antigo → Gera novo par
                               → Rotacao automatica (refresh token rotation)

Logout → Revoga refresh token → Limpa cookie httpOnly
```

### 5.2 Protecoes

| Vetor de ataque        | Protecao                                           |
|------------------------|----------------------------------------------------|
| SQL Injection          | Prisma (parameterized queries), validacao DTO       |
| XSS                    | Next.js (escape automatico), CSP headers, httpOnly  |
| CSRF                   | SameSite cookies, CSRF token em mutations           |
| Brute force            | Rate limiting (Redis), lockout apos 5 tentativas    |
| Data leak entre tenants| TenantGuard obrigatorio, RLS no PostgreSQL           |
| Token roubo            | httpOnly cookies, token rotation, fingerprinting     |
| Upload malicioso       | Validacao MIME, scan, limite de tamanho              |
| LGPD                   | Encriptacao PII, direito ao esquecimento, consent    |

### 5.3 Headers de Seguranca

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 5.4 Validacao de dados

- Todos os endpoints usam DTOs com `class-validator`
- Sanitizacao de inputs com `class-transformer`
- Validacao de CPF/CNPJ com algoritmo proprio
- Valores monetarios SEMPRE em centavos (INT) - nunca float

---

## 6. Estrategia de Logs e Auditoria

### Camada 1: Application Logs (Pino)
```
Request → Pino Logger → stdout → Agregador (CloudWatch/Loki)
```
- Nivel: info, warn, error
- Inclui: request_id, tenant_id, user_id, method, path, status, duration
- Sem dados sensiveis (PII mascarado)

### Camada 2: Audit Trail (banco)
```
Interceptor NestJS → Detecta mutacao → Captura old/new values → INSERT audit_logs
```
- Toda operacao CRUD em entidades de negocio
- Login/logout
- Exportacoes de dados
- Alteracoes de permissao
- Retenção: 5 anos (particionado por mes)

### Camada 3: Alertas
- Erro 5xx → Sentry → Notificacao imediata
- Tentativas de acesso cross-tenant → Alerta de seguranca
- Taxa de erro > 1% → Alerta operacional

---

## 7. Estrategia de Escalabilidade

### Fase 1 (0-50 corretoras): Monolito modular
- 1 instancia NestJS
- 1 PostgreSQL (RDS)
- 1 Redis
- Deploy: Docker Compose ou ECS single task
- Tenant isolado por coluna `tenant_id` + RLS

### Fase 2 (50-500 corretoras): Scale-up
- NestJS em cluster (PM2 ou ECS com auto-scaling)
- PostgreSQL com read replicas
- Redis cluster
- Tenant isolado por schema PostgreSQL
- CDN para assets estaticos
- Job queue (BullMQ) para relatorios pesados

### Fase 3 (500+ corretoras): Scale-out
- Microservicos: Auth, Core, Financial, Reports, Notifications
- PostgreSQL particionado ou database-per-tenant (grandes)
- API Gateway (Kong/AWS API Gateway)
- Event-driven (SQS/SNS ou Kafka)
- Elasticsearch para busca e analytics

### Performance desde o dia 1:
- Paginacao cursor-based em todas as listagens
- Indices compostos nas queries mais frequentes
- Cache Redis: dashboard stats (TTL 5min), listas de operadoras (TTL 1h)
- Relatorios pesados via job queue (gera e notifica)
- Connection pooling (PgBouncer quando necessario)

---

## 8. Diagrama Logico da Aplicacao

```
                    ┌─────────────────────────────────────────┐
                    │              FRONTEND                     │
                    │          Next.js 14 (App Router)          │
                    │                                           │
                    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
                    │  │Dashboard │ │Cadastros │ │Financeiro│ │
                    │  └──────────┘ └──────────┘ └──────────┘ │
                    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
                    │  │Relatorios│ │  Config  │ │  Auth    │ │
                    │  └──────────┘ └──────────┘ └──────────┘ │
                    └────────────────────┬────────────────────┘
                                         │ HTTPS (REST API)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │              API GATEWAY                  │
                    │      Rate Limit · CORS · Auth Check      │
                    └────────────────────┬────────────────────┘
                                         │
                    ┌────────────────────┬┴──────────────────┐
                    │                    │                     │
                    ▼                    ▼                     ▼
          ┌─────────────┐    ┌─────────────────┐   ┌──────────────┐
          │  Auth Module │    │  Core Module     │   │ Financial    │
          │             │    │                   │   │  Module      │
          │ Login       │    │ Clients           │   │              │
          │ Register    │    │ Insurers          │   │ Receivables  │
          │ Refresh     │    │ Sellers           │   │ Commissions  │
          │ RBAC        │    │ Policies          │   │ Reports      │
          └──────┬──────┘    └────────┬──────────┘   └──────┬───────┘
                 │                    │                      │
                 └────────────┬───────┘──────────────────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
               ▼              ▼              ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │PostgreSQL │  │   Redis   │  │    S3     │
        │           │  │           │  │           │
        │ public    │  │ Sessions  │  │ Docs      │
        │ tenant_*  │  │ Cache     │  │ Exports   │
        │ audit     │  │ Queues    │  │ Proofs    │
        └───────────┘  └───────────┘  └───────────┘
                              │
                              ▼
                       ┌───────────┐
                       │  BullMQ   │
                       │           │
                       │ Emails    │
                       │ Reports   │
                       │ Renewals  │
                       │ Alerts    │
                       └───────────┘
```

### Fluxo de uma requisicao:

```
1. Browser → Next.js (SSR/CSR)
2. Next.js → API NestJS (Bearer Token)
3. NestJS Guards: JWT → Tenant → Roles → Ownership
4. Controller → Service → Prisma → PostgreSQL (schema do tenant)
5. Interceptor captura mutacoes → Audit Log
6. Response → DTO serializado (sem dados internos)
7. Cache invalidation → Redis
```

---

## 9. Integracao Futura com Contabilidade

### Preparacao:
- Todos os valores monetarios em centavos (INT)
- Tabela `receivables` com campos para conciliacao
- Modulo financeiro separado (facil extrair como microservico)
- Endpoints preparados para webhooks:
  - `POST /webhooks/accounting` (receber dados)
  - Eventos emitidos: `receivable.paid`, `commission.paid`, `policy.created`
- Formato de exportacao: CNAB, OFX, CSV padrao contabil
- Campos reservados: `accounting_code`, `cost_center` (adicionaveis via JSONB `metadata`)

---

## 10. LGPD

- Consentimento registrado no cadastro do cliente
- Endpoint `DELETE /clients/:id/anonymize` (anonimiza em vez de deletar, mantem historico financeiro)
- Logs de acesso a dados pessoais
- Encriptacao de PII em repouso (CPF, email) via pgcrypto ou aplicacao
- Exportacao de dados do titular: `GET /clients/:id/data-export`
- DPO configuravel nas settings do tenant
