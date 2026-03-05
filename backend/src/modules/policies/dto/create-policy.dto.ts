import {
  IsString, IsUUID, IsEnum, IsNumber, IsDateString,
  IsOptional, IsBoolean, IsInt, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsUUID()
  insurerId: string;

  @ApiProperty()
  @IsUUID()
  sellerId: string;

  @ApiProperty({ example: 'APL-2026-001' })
  @IsString()
  policyNumber: string;

  @ApiProperty({ enum: ['auto', 'health', 'life', 'business', 'other'] })
  @IsEnum(['auto', 'health', 'life', 'business', 'other'])
  category: 'auto' | 'health' | 'life' | 'business' | 'other';

  @ApiPropertyOptional({ enum: ['active', 'lifetime'], default: 'active' })
  @IsOptional()
  @IsEnum(['active', 'lifetime'])
  type?: 'active' | 'lifetime';

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2027-03-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2027-02-01' })
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiProperty({ example: 120000, description: 'Valor do premio em centavos (R$ 1.200,00 = 120000)' })
  @IsInt()
  @Min(1)
  premiumCents: number;

  @ApiProperty({ enum: ['boleto', 'credit_card', 'debit', 'pix', 'transfer'] })
  @IsEnum(['boleto', 'credit_card', 'debit', 'pix', 'transfer'])
  paymentMethod: 'boleto' | 'credit_card' | 'debit' | 'pix' | 'transfer';

  @ApiProperty({ example: 12, description: 'Numero de parcelas' })
  @IsInt()
  @Min(1)
  @Max(60)
  installments: number;

  @ApiProperty({ example: 15.0, description: '% comissao da corretora' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  brokerCommissionPct: number;

  @ApiProperty({ example: 5.0, description: '% comissao do vendedor' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sellerCommissionPct: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
