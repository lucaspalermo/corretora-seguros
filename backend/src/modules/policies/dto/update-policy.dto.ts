import { IsOptional, IsEnum, IsString, IsNumber, IsDateString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ enum: ['auto', 'health', 'life', 'business', 'other'] })
  @IsOptional()
  @IsEnum(['auto', 'health', 'life', 'business', 'other'])
  category?: 'auto' | 'health' | 'life' | 'business' | 'other';

  @ApiPropertyOptional({ enum: ['active', 'lifetime', 'cancelled'] })
  @IsOptional()
  @IsEnum(['active', 'lifetime', 'cancelled'])
  type?: 'active' | 'lifetime' | 'cancelled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  premiumCents?: number;

  @ApiPropertyOptional({ enum: ['boleto', 'credit_card', 'debit', 'pix', 'transfer'] })
  @IsOptional()
  @IsEnum(['boleto', 'credit_card', 'debit', 'pix', 'transfer'])
  paymentMethod?: 'boleto' | 'credit_card' | 'debit' | 'pix' | 'transfer';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  installments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  brokerCommissionPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sellerCommissionPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
