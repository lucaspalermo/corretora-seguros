import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, user, ip, headers } = request;

    if (!MUTATION_METHODS.includes(method) || !user) {
      return next.handle();
    }

    const entity = this.extractEntity(path);
    const action = this.methodToAction(method);

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              action,
              entity,
              entityId: responseData?.id || this.extractEntityId(path),
              newValues: method !== 'DELETE' && request.body ? JSON.stringify(request.body) : null,
              ipAddress: ip || headers['x-forwarded-for'] || null,
              userAgent: headers['user-agent'] || null,
            },
          });
        } catch (err) {
          // Nao bloquear a requisicao por falha no audit log
          console.error('Falha ao registrar audit log:', err.message);
        }
      }),
    );
  }

  private extractEntity(path: string): string {
    const parts = path.replace('/api/', '').split('/');
    return parts[0] || 'unknown';
  }

  private extractEntityId(path: string): string | null {
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = path.match(uuidRegex);
    return match ? match[0] : null;
  }

  private methodToAction(method: string): string {
    const map = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
    return map[method] || method;
  }
}
