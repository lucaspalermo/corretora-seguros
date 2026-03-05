import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, MinLength, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInsurerDto {
  @ApiProperty({ example: 'Porto Seguro' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: ['auto', 'health', 'life', 'business', 'other'] })
  @IsEnum(['auto', 'health', 'life', 'business', 'other'])
  category: 'auto' | 'health' | 'life' | 'business' | 'other';

  @ApiProperty({ example: 15.5, description: 'Percentual padrao de comissao' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  defaultCommissionPct: number;

  @ApiPropertyOptional({ example: 'Repasse mensal' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
