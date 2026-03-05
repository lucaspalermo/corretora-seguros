import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Criar plano padrao
  const plan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Basico',
      maxUsers: 5,
      maxPolicies: 500,
      maxStorageMb: 1024,
      priceCents: 0,
      billingCycle: 'monthly',
      features: JSON.stringify({ reports: true, audit: true, dashboard: true }),
    },
  });
  console.log(`Plano criado: ${plan.name}`);

  const planPro = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Profissional',
      maxUsers: 20,
      maxPolicies: 5000,
      maxStorageMb: 10240,
      priceCents: 14900,
      billingCycle: 'monthly',
      features: JSON.stringify({ reports: true, audit: true, dashboard: true, export: true }),
    },
  });
  console.log(`Plano criado: ${planPro.name}`);

  // Criar tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Corretora Demo',
      slug: 'demo',
      document: '12.345.678/0001-90',
      schemaName: 'tenant_demo',
      planId: plan.id,
      settings: JSON.stringify({
        companyPhone: '(11) 99999-0000',
        companyEmail: 'contato@corretorademo.com.br',
      }),
    },
  });
  console.log(`Tenant criado: ${tenant.name}`);

  // Criar usuario admin
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000100',
      tenantId: tenant.id,
      name: 'Administrador',
      email: 'admin@demo.com',
      passwordHash,
      role: 'admin',
    },
  });
  console.log(`Usuario admin criado: ${admin.email}`);

  // Criar usuario financeiro
  const finUser = await prisma.user.upsert({
    where: { email: 'financeiro@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Financeiro',
      email: 'financeiro@demo.com',
      passwordHash: await bcrypt.hash('fin123', 12),
      role: 'financial',
    },
  });
  console.log(`Usuario financeiro criado: ${finUser.email}`);

  // Criar operadoras de exemplo
  const insurer1 = await prisma.insurer.upsert({
    where: { id: '00000000-0000-0000-0000-000000001001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000001001',
      tenantId: tenant.id,
      name: 'Unimed',
      category: 'health',
      defaultCommissionPct: 8,
      paymentMethod: 'Boleto',
      contactName: 'Central Unimed',
      contactPhone: '(11) 3333-4444',
      contactEmail: 'comissoes@unimed.com.br',
    },
  });

  const insurer2 = await prisma.insurer.upsert({
    where: { id: '00000000-0000-0000-0000-000000001002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000001002',
      tenantId: tenant.id,
      name: 'Porto Seguro',
      category: 'auto',
      defaultCommissionPct: 15,
      paymentMethod: 'Transferencia',
      contactName: 'Departamento Corretores',
      contactPhone: '(11) 3366-3366',
      contactEmail: 'corretores@portoseguro.com.br',
    },
  });

  const insurer3 = await prisma.insurer.upsert({
    where: { id: '00000000-0000-0000-0000-000000001003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000001003',
      tenantId: tenant.id,
      name: 'Bradesco Vida',
      category: 'life',
      defaultCommissionPct: 20,
      paymentMethod: 'Pix',
      contactName: 'Ana Bradesco',
      contactPhone: '(11) 3344-5566',
      contactEmail: 'vida@bradesco.com.br',
    },
  });
  console.log('Operadoras criadas: Unimed, Porto Seguro, Bradesco Vida');

  // Criar vendedor
  const seller = await prisma.seller.upsert({
    where: { id: '00000000-0000-0000-0000-000000002001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000002001',
      tenantId: tenant.id,
      name: 'Carlos Vendedor',
      cpf: '123.456.789-00',
      defaultCommissionPct: 30,
      phone: '(11) 98888-7777',
      email: 'carlos@demo.com',
    },
  });
  console.log(`Vendedor criado: ${seller.name}`);

  // Criar clientes
  const client1 = await prisma.client.upsert({
    where: { id: '00000000-0000-0000-0000-000000003001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000003001',
      tenantId: tenant.id,
      name: 'Maria Silva',
      document: '987.654.321-00',
      documentType: 'cpf',
      personType: 'pf',
      phone: '(11) 97777-6666',
      email: 'maria@email.com',
      addressStreet: 'Rua das Flores',
      addressNumber: '123',
      addressNeighborhood: 'Centro',
      addressCity: 'Sao Paulo',
      addressState: 'SP',
      addressZip: '01001-000',
      lgpdConsentAt: new Date(),
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: '00000000-0000-0000-0000-000000003002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000003002',
      tenantId: tenant.id,
      name: 'Empresa ABC Ltda',
      document: '11.222.333/0001-44',
      documentType: 'cnpj',
      personType: 'pj',
      phone: '(11) 3333-2222',
      email: 'contato@empresaabc.com',
      addressStreet: 'Av Paulista',
      addressNumber: '1000',
      addressComplement: 'Sala 501',
      addressNeighborhood: 'Bela Vista',
      addressCity: 'Sao Paulo',
      addressState: 'SP',
      addressZip: '01310-100',
      lgpdConsentAt: new Date(),
    },
  });

  const client3 = await prisma.client.upsert({
    where: { id: '00000000-0000-0000-0000-000000003003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000003003',
      tenantId: tenant.id,
      name: 'Pedro Santos',
      document: '555.666.777-88',
      documentType: 'cpf',
      personType: 'pf',
      phone: '(11) 97777-3333',
      email: 'pedro@email.com',
      addressCity: 'Campinas',
      addressState: 'SP',
      lgpdConsentAt: new Date(),
    },
  });
  console.log('Clientes criados: Maria Silva, Empresa ABC, Pedro Santos');

  // Criar apolice - auto
  const policy1 = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000004001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000004001',
      tenantId: tenant.id,
      clientId: client1.id,
      insurerId: insurer2.id,
      sellerId: seller.id,
      policyNumber: 'AUTO-2026-0001',
      category: 'auto',
      type: 'active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      renewalDate: new Date('2026-12-01'),
      premiumCents: 360000,
      paymentMethod: 'boleto',
      installments: 12,
      brokerCommissionPct: 15,
      sellerCommissionPct: 5,
      autoRenew: true,
    },
  });

  // Criar apolice - saude
  const policy2 = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000004002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000004002',
      tenantId: tenant.id,
      clientId: client2.id,
      insurerId: insurer1.id,
      sellerId: seller.id,
      policyNumber: 'SAUDE-2026-0001',
      category: 'health',
      type: 'active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      renewalDate: new Date('2026-12-01'),
      premiumCents: 1200000,
      paymentMethod: 'pix',
      installments: 12,
      brokerCommissionPct: 8,
      sellerCommissionPct: 2.4,
      autoRenew: false,
    },
  });
  console.log('Apolices criadas: AUTO-2026-0001, SAUDE-2026-0001');

  // Criar parcelas para apolice auto
  const installmentAmount = Math.round(policy1.premiumCents / 12);
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date(2026, i - 1, 10);
    const brokerComm = Math.round(installmentAmount * 0.15);
    const sellerComm = Math.round(installmentAmount * 0.05);
    const status = i <= 2 ? 'received' : i === 3 ? 'overdue' : 'pending';

    const receivable = await prisma.receivable.upsert({
      where: { id: `00000000-0000-0000-0000-0000000050${String(i).padStart(2, '0')}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-0000000050${String(i).padStart(2, '0')}`,
        tenantId: tenant.id,
        policyId: policy1.id,
        clientId: client1.id,
        installmentNumber: i,
        grossAmountCents: installmentAmount,
        brokerCommissionCents: brokerComm,
        sellerCommissionCents: sellerComm,
        netAmountCents: installmentAmount - brokerComm - sellerComm,
        dueDate,
        status,
        receivedDate: status === 'received' ? new Date(2026, i - 1, 8) : undefined,
      },
    });

    await prisma.commissionPayment.create({
      data: {
        tenantId: tenant.id,
        sellerId: seller.id,
        receivableId: receivable.id,
        amountCents: sellerComm,
        status: status === 'received' ? 'paid' : 'pending',
        paidDate: status === 'received' ? new Date(2026, i - 1, 10) : undefined,
      },
    });
  }
  console.log('12 parcelas e comissoes criadas (apolice auto)');

  // Notificacoes de exemplo
  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      type: 'overdue',
      title: 'Parcela em atraso',
      message: 'A parcela 3 da cliente Maria Silva esta em atraso desde 10/03/2026.',
      entity: 'receivable',
      entityId: '00000000-0000-0000-0000-000000005003',
    },
  });

  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      type: 'system',
      title: 'Bem-vindo ao SeguraSaaS',
      message: 'Sua corretora foi configurada com sucesso. Explore o sistema!',
    },
  });
  console.log('Notificacoes criadas');

  console.log('\n=== SEED CONCLUIDO ===');
  console.log('Login admin: admin@demo.com / admin123');
  console.log('Login financeiro: financeiro@demo.com / fin123');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
