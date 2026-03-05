# Estrutura de Pastas - Corretora de Seguros SaaS

## Backend (NestJS)

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
│       ├── plans.seed.ts
│       └── demo-tenant.seed.ts
├── src/
│   ├── main.ts                          # Bootstrap, swagger, cors
│   ├── app.module.ts                    # Root module
│   │
│   ├── common/                          # Compartilhado
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts    # @CurrentUser()
│   │   │   ├── current-tenant.decorator.ts  # @CurrentTenant()
│   │   │   ├── roles.decorator.ts           # @Roles('admin','financial')
│   │   │   └── api-paginated.decorator.ts   # Swagger pagination
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts            # cursor, limit, order
│   │   │   └── api-response.dto.ts          # Padrao de resposta
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts     # Tratamento global de erros
│   │   │   └── prisma-exception.filter.ts   # Erros do Prisma
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── tenant.guard.ts              # Valida e injeta tenant
│   │   │   └── ownership.guard.ts           # Vendedor so ve seus dados
│   │   ├── interceptors/
│   │   │   ├── audit.interceptor.ts         # Log de auditoria automatico
│   │   │   ├── transform.interceptor.ts     # Serializa resposta
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   ├── cpf-cnpj-validation.pipe.ts
│   │   │   └── parse-uuid.pipe.ts
│   │   ├── utils/
│   │   │   ├── cpf-cnpj.util.ts             # Validacao CPF/CNPJ
│   │   │   ├── money.util.ts                # Conversoes centavos
│   │   │   └── pagination.util.ts           # Cursor pagination helper
│   │   └── constants/
│   │       ├── roles.constant.ts
│   │       └── errors.constant.ts
│   │
│   ├── config/                          # Configuracao
│   │   ├── config.module.ts
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── s3.config.ts
│   │
│   ├── database/                        # Prisma + Multi-tenant
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts            # PrismaClient wrapper
│   │   ├── tenant-prisma.service.ts     # PrismaClient por tenant (SET search_path)
│   │   └── tenant-provisioning.service.ts # Cria schema + migra
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts       # login, register, refresh, logout
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── tokens.dto.ts
│   │   │
│   │   ├── tenants/                     # Gestao de corretoras (super-admin)
│   │   │   ├── tenants.module.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.service.ts
│   │   │   └── dto/
│   │   │       ├── create-tenant.dto.ts
│   │   │       └── update-tenant.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── clients/
│   │   │   ├── clients.module.ts
│   │   │   ├── clients.controller.ts
│   │   │   ├── clients.service.ts
│   │   │   └── dto/
│   │   │       ├── create-client.dto.ts
│   │   │       ├── update-client.dto.ts
│   │   │       └── client-filter.dto.ts
│   │   │
│   │   ├── insurers/
│   │   │   ├── insurers.module.ts
│   │   │   ├── insurers.controller.ts
│   │   │   ├── insurers.service.ts
│   │   │   └── dto/
│   │   │       ├── create-insurer.dto.ts
│   │   │       └── update-insurer.dto.ts
│   │   │
│   │   ├── sellers/
│   │   │   ├── sellers.module.ts
│   │   │   ├── sellers.controller.ts
│   │   │   ├── sellers.service.ts
│   │   │   └── dto/
│   │   │       ├── create-seller.dto.ts
│   │   │       └── update-seller.dto.ts
│   │   │
│   │   ├── policies/
│   │   │   ├── policies.module.ts
│   │   │   ├── policies.controller.ts
│   │   │   ├── policies.service.ts
│   │   │   ├── policies-renewal.service.ts  # Logica de renovacao
│   │   │   └── dto/
│   │   │       ├── create-policy.dto.ts
│   │   │       ├── update-policy.dto.ts
│   │   │       └── policy-filter.dto.ts
│   │   │
│   │   ├── financial/
│   │   │   ├── financial.module.ts
│   │   │   ├── receivables/
│   │   │   │   ├── receivables.controller.ts
│   │   │   │   ├── receivables.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-receivable.dto.ts
│   │   │   │       ├── update-receivable.dto.ts
│   │   │   │       └── receivable-filter.dto.ts
│   │   │   └── commissions/
│   │   │       ├── commissions.controller.ts
│   │   │       ├── commissions.service.ts
│   │   │       └── dto/
│   │   │           └── commission-filter.dto.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts
│   │   │   ├── generators/
│   │   │   │   ├── monthly-receipts.generator.ts
│   │   │   │   ├── by-insurer.generator.ts
│   │   │   │   ├── by-seller.generator.ts
│   │   │   │   ├── policies-active.generator.ts
│   │   │   │   ├── overdue.generator.ts
│   │   │   │   └── commissions.generator.ts
│   │   │   └── exporters/
│   │   │       ├── excel.exporter.ts        # ExcelJS
│   │   │       └── pdf.exporter.ts          # Futuro
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   └── dashboard.service.ts         # Aggregacoes com cache Redis
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── notifications.gateway.ts     # WebSocket (futuro real-time)
│   │   │
│   │   └── audit/
│   │       ├── audit.module.ts
│   │       ├── audit.controller.ts          # GET logs (admin only)
│   │       └── audit.service.ts
│   │
│   ├── jobs/                            # Workers BullMQ
│   │   ├── jobs.module.ts
│   │   ├── renewal-check.job.ts         # Verifica renovacoes pendentes
│   │   ├── overdue-check.job.ts         # Marca parcelas atrasadas
│   │   ├── report-generation.job.ts     # Gera relatorios pesados
│   │   └── notification-send.job.ts     # Envia emails/notificacoes
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts         # /health para load balancer
│
├── test/
│   ├── e2e/
│   │   ├── auth.e2e-spec.ts
│   │   ├── clients.e2e-spec.ts
│   │   ├── policies.e2e-spec.ts
│   │   └── financial.e2e-spec.ts
│   └── unit/
│       ├── services/
│       └── utils/
│
├── .env.example
├── .env
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml                   # PostgreSQL + Redis + MinIO
├── Dockerfile
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## Frontend (Next.js 14)

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── app/                             # App Router
│   │   ├── layout.tsx                   # Root layout (providers)
│   │   ├── page.tsx                     # Landing page / redirect
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                      # Grupo: paginas publicas
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   └── (dashboard)/                 # Grupo: paginas autenticadas
│   │       ├── layout.tsx               # Sidebar + Header + Guards
│   │       ├── page.tsx                 # Dashboard principal
│   │       │
│   │       ├── clients/
│   │       │   ├── page.tsx             # Lista de clientes
│   │       │   ├── new/
│   │       │   │   └── page.tsx         # Novo cliente
│   │       │   └── [id]/
│   │       │       ├── page.tsx         # Detalhes do cliente
│   │       │       └── edit/
│   │       │           └── page.tsx     # Editar cliente
│   │       │
│   │       ├── insurers/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       │
│   │       ├── sellers/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       │
│   │       ├── policies/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx         # Detalhes com parcelas
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       │
│   │       ├── financial/
│   │       │   ├── page.tsx             # Visao geral financeiro
│   │       │   ├── receivables/
│   │       │   │   └── page.tsx         # Contas a receber
│   │       │   └── commissions/
│   │       │       └── page.tsx         # Comissoes
│   │       │
│   │       ├── reports/
│   │       │   └── page.tsx             # Hub de relatorios
│   │       │
│   │       ├── notifications/
│   │       │   └── page.tsx
│   │       │
│   │       ├── audit/
│   │       │   └── page.tsx             # Log de auditoria
│   │       │
│   │       └── settings/
│   │           ├── page.tsx             # Config geral
│   │           ├── users/
│   │           │   └── page.tsx         # Gestao de usuarios
│   │           └── profile/
│   │               └── page.tsx         # Perfil do usuario
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui (auto-gerado)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── user-menu.tsx
│   │   ├── forms/
│   │   │   ├── client-form.tsx
│   │   │   ├── insurer-form.tsx
│   │   │   ├── seller-form.tsx
│   │   │   ├── policy-form.tsx
│   │   │   └── receivable-form.tsx
│   │   ├── tables/
│   │   │   ├── data-table.tsx           # Tabela generica (sort, filter, pagination)
│   │   │   ├── clients-columns.tsx
│   │   │   ├── policies-columns.tsx
│   │   │   └── receivables-columns.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── revenue-chart.tsx
│   │   │   ├── policies-by-category.tsx
│   │   │   ├── seller-ranking.tsx
│   │   │   └── overdue-alerts.tsx
│   │   └── shared/
│   │       ├── loading-skeleton.tsx
│   │       ├── empty-state.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── cpf-cnpj-input.tsx
│   │       ├── money-input.tsx
│   │       └── date-range-picker.tsx
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-tenant.ts
│   │   ├── use-debounce.ts
│   │   └── use-permissions.ts
│   │
│   ├── lib/
│   │   ├── api.ts                       # Axios/fetch wrapper com interceptors
│   │   ├── auth.ts                      # Token management
│   │   ├── utils.ts                     # cn(), formatMoney(), formatCpf()
│   │   └── validators.ts               # Zod schemas (espelho dos DTOs)
│   │
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   ├── tenant-provider.tsx
│   │   ├── query-provider.tsx           # TanStack Query
│   │   └── theme-provider.tsx
│   │
│   ├── services/                        # API calls organizadas por modulo
│   │   ├── auth.service.ts
│   │   ├── clients.service.ts
│   │   ├── insurers.service.ts
│   │   ├── sellers.service.ts
│   │   ├── policies.service.ts
│   │   ├── financial.service.ts
│   │   ├── reports.service.ts
│   │   ├── dashboard.service.ts
│   │   └── notifications.service.ts
│   │
│   ├── types/
│   │   ├── api.types.ts                 # Response types
│   │   ├── client.types.ts
│   │   ├── insurer.types.ts
│   │   ├── seller.types.ts
│   │   ├── policy.types.ts
│   │   ├── financial.types.ts
│   │   └── auth.types.ts
│   │
│   └── middleware.ts                    # Next.js middleware (auth redirect)
│
├── .env.local
├── .eslintrc.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Monorepo (Raiz)

```
corretora-seguros/
├── backend/                 # NestJS API
├── frontend/                # Next.js App
├── docs/                    # Documentacao
│   ├── ARQUITETURA.md
│   ├── ESTRUTURA-PASTAS.md
│   ├── prisma-schema.prisma
│   └── API.md               # Documentacao dos endpoints (futuro)
├── docker-compose.yml       # Dev: PostgreSQL + Redis + MinIO
├── .gitignore
├── README.md
└── turbo.json               # Opcional: Turborepo para monorepo
```

---

## Docker Compose (Desenvolvimento)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: corretora_saas
      POSTGRES_USER: corretora
      POSTGRES_PASSWORD: corretora_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio
    environment:
      MINIO_ROOT_USER: minio_dev
      MINIO_ROOT_PASSWORD: minio_dev_secret
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## API Endpoints (Resumo)

### Auth
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Clients
```
GET    /api/clients              # Listagem paginada (cursor)
GET    /api/clients/:id          # Detalhes
POST   /api/clients              # Criar
PATCH  /api/clients/:id          # Atualizar
DELETE /api/clients/:id          # Soft delete / inativar
GET    /api/clients/:id/policies # Apolices do cliente
```

### Insurers
```
GET    /api/insurers
GET    /api/insurers/:id
POST   /api/insurers
PATCH  /api/insurers/:id
DELETE /api/insurers/:id
```

### Sellers
```
GET    /api/sellers
GET    /api/sellers/:id
POST   /api/sellers
PATCH  /api/sellers/:id
DELETE /api/sellers/:id
GET    /api/sellers/:id/commissions
```

### Policies
```
GET    /api/policies
GET    /api/policies/:id
POST   /api/policies             # Cria apolice + gera parcelas automaticamente
PATCH  /api/policies/:id
DELETE /api/policies/:id
POST   /api/policies/:id/cancel
POST   /api/policies/:id/renew
```

### Financial
```
GET    /api/receivables
GET    /api/receivables/:id
PATCH  /api/receivables/:id      # Marcar como recebido, editar valor
GET    /api/commissions
PATCH  /api/commissions/:id      # Marcar como pago
```

### Reports
```
GET    /api/reports/monthly-receipts?month=2026-03
GET    /api/reports/by-insurer?from=2026-01-01&to=2026-03-31
GET    /api/reports/by-seller?from=2026-01-01&to=2026-03-31
GET    /api/reports/active-policies
GET    /api/reports/overdue
GET    /api/reports/commissions?from=2026-01-01&to=2026-03-31
POST   /api/reports/export        # Gera Excel async (BullMQ)
```

### Dashboard
```
GET    /api/dashboard/stats       # KPIs (cached 5min)
GET    /api/dashboard/charts      # Dados para graficos
```

### Notifications
```
GET    /api/notifications
PATCH  /api/notifications/:id/read
POST   /api/notifications/read-all
```

### Audit
```
GET    /api/audit-logs            # Admin only, paginado
```

### Tenants (Super-admin)
```
POST   /api/tenants               # Criar nova corretora
GET    /api/tenants
PATCH  /api/tenants/:id
```
