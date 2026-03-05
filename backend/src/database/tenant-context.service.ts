import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantId: string;
  private tenantSchemaName: string;

  setTenant(tenantId: string, schemaName: string) {
    this.tenantId = tenantId;
    this.tenantSchemaName = schemaName;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getSchemaName(): string {
    return this.tenantSchemaName;
  }
}
