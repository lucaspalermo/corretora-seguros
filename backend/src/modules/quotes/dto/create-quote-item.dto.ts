import { IsInt, IsNumber, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteItemDto {
  @ApiProperty()
  @IsString()
  insurerId: string;

  @ApiProperty({ description: 'Valor do premio em centavos' })
  @IsInt()
  @Min(1)
  premiumCents: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  installments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: '% comissao corretora' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  brokerCommissionPct: number;

  @ApiPropertyOptional({ description: '% comissao vendedor' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sellerCommissionPct?: number;

  @ApiPropertyOptional({ description: 'Coberturas em JSON string' })
  @IsOptional()
  @IsString()
  coverages?: string;

  @ApiPropertyOptional({ description: 'Condicoes/franquias em JSON string' })
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proposalNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
