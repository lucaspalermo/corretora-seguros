import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    // Resolve tenant pelo email do usuario (sem precisar de header x-tenant-id)
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, status: 'active' },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Verifica se o tenant esta ativo
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Empresa suspensa ou inativa');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Atualiza ultimo login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user);
  }

  async register(dto: RegisterDto) {
    // Verifica se email ja existe
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email ja cadastrado');
    }

    // Busca ou cria plano padrao
    let defaultPlan = await this.prisma.plan.findFirst({
      where: { name: 'Basico', status: 'active' },
    });

    if (!defaultPlan) {
      defaultPlan = await this.prisma.plan.create({
        data: {
          name: 'Basico',
          maxUsers: 5,
          maxPolicies: 500,
          maxStorageMb: 1024,
          priceCents: 0,
          billingCycle: 'monthly',
          features: JSON.stringify({ dashboard: true, reports: true, notifications: true }),
        },
      });
    }

    // Gera slug unico a partir do nome da empresa
    const baseSlug = dto.companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let slugSuffix = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugSuffix++}`;
    }

    const schemaName = `tenant_${slug.replace(/-/g, '_')}`;

    // Cria tenant + usuario admin em transacao
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          slug,
          document: '',
          schemaName,
          planId: defaultPlan.id,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.name,
          email: dto.email,
          passwordHash,
          cpf: dto.cpf,
          role: 'admin',
        },
      });

      return { tenant, user };
    });

    return this.generateTokens(result.user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    // Revoga o token atual (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Usuario inativo');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = randomUUID();
    const refreshTokenHash = this.hashToken(refreshToken);

    // Salva o refresh token no banco
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
