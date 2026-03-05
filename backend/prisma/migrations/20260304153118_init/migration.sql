-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "document" TEXT NOT NULL DEFAULT '',
    "schema_name" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" TEXT DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "max_users" INTEGER NOT NULL,
    "max_policies" INTEGER NOT NULL,
    "max_storage_mb" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "billing_cycle" TEXT NOT NULL DEFAULT 'monthly',
    "features" TEXT DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "cpf" TEXT,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "person_type" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address_street" TEXT,
    "address_number" TEXT,
    "address_complement" TEXT,
    "address_neighborhood" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_zip" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "lgpd_consent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "insurers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "default_commission_pct" REAL NOT NULL,
    "payment_method" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "default_commission_pct" REAL NOT NULL,
    "special_commission_pct" REAL,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "insurer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'active',
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "renewal_date" DATETIME,
    "premium_cents" INTEGER NOT NULL,
    "payment_method" TEXT NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "broker_commission_pct" REAL NOT NULL,
    "seller_commission_pct" REAL NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "cancelled_at" DATETIME,
    CONSTRAINT "policies_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "policies_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "policies_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "receivables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "gross_amount_cents" INTEGER NOT NULL,
    "broker_commission_cents" INTEGER NOT NULL,
    "seller_commission_cents" INTEGER NOT NULL,
    "net_amount_cents" INTEGER NOT NULL,
    "due_date" DATETIME NOT NULL,
    "received_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_proof_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "receivables_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "receivables_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "commission_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "receivable_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "paid_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commission_payments_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "commission_payments_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "receivables" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" TEXT,
    "new_values" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "entity" TEXT,
    "entity_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_schema_name_key" ON "tenants"("schema_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "clients_tenant_id_idx" ON "clients"("tenant_id");

-- CreateIndex
CREATE INDEX "clients_document_idx" ON "clients"("document");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "insurers_tenant_id_idx" ON "insurers"("tenant_id");

-- CreateIndex
CREATE INDEX "insurers_category_idx" ON "insurers"("category");

-- CreateIndex
CREATE INDEX "insurers_status_idx" ON "insurers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_user_id_key" ON "sellers"("user_id");

-- CreateIndex
CREATE INDEX "sellers_tenant_id_idx" ON "sellers"("tenant_id");

-- CreateIndex
CREATE INDEX "sellers_cpf_idx" ON "sellers"("cpf");

-- CreateIndex
CREATE INDEX "sellers_status_idx" ON "sellers"("status");

-- CreateIndex
CREATE INDEX "policies_tenant_id_idx" ON "policies"("tenant_id");

-- CreateIndex
CREATE INDEX "policies_policy_number_idx" ON "policies"("policy_number");

-- CreateIndex
CREATE INDEX "policies_client_id_idx" ON "policies"("client_id");

-- CreateIndex
CREATE INDEX "policies_insurer_id_idx" ON "policies"("insurer_id");

-- CreateIndex
CREATE INDEX "policies_seller_id_idx" ON "policies"("seller_id");

-- CreateIndex
CREATE INDEX "policies_category_type_idx" ON "policies"("category", "type");

-- CreateIndex
CREATE INDEX "policies_end_date_idx" ON "policies"("end_date");

-- CreateIndex
CREATE INDEX "policies_renewal_date_idx" ON "policies"("renewal_date");

-- CreateIndex
CREATE INDEX "receivables_tenant_id_idx" ON "receivables"("tenant_id");

-- CreateIndex
CREATE INDEX "receivables_policy_id_idx" ON "receivables"("policy_id");

-- CreateIndex
CREATE INDEX "receivables_client_id_idx" ON "receivables"("client_id");

-- CreateIndex
CREATE INDEX "receivables_due_date_status_idx" ON "receivables"("due_date", "status");

-- CreateIndex
CREATE INDEX "receivables_status_idx" ON "receivables"("status");

-- CreateIndex
CREATE INDEX "receivables_received_date_idx" ON "receivables"("received_date");

-- CreateIndex
CREATE INDEX "commission_payments_tenant_id_idx" ON "commission_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_payments_seller_id_paid_date_idx" ON "commission_payments"("seller_id", "paid_date");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
