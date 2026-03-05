import { IsOptional, IsDateString, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReceivableDto {
  @ApiPropertyOptional({ enum: ['pending', 'received', 'overdue', 'cancelled'] })
  @IsOptional()
  @IsEnum(['pending', 'received', 'overdue', 'cancelled'])
  status?: 'pending' | 'received' | 'overdue' | 'cancelled';

  @ApiPropertyOptional({ example: '2026-03-15', description: 'Data de recebimento' })
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @ApiPropertyOptional({ description: 'Valor bruto em centavos (edicao manual)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  grossAmountCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentProofUrl?: string;
}
