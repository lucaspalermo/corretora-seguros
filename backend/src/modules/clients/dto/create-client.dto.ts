import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'Maria Silva Ltda' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  @IsString()
  document: string;

  @ApiProperty({ enum: ['cpf', 'cnpj'] })
  @IsEnum(['cpf', 'cnpj'], { message: 'Tipo de documento deve ser cpf ou cnpj' })
  documentType: 'cpf' | 'cnpj';

  @ApiProperty({ enum: ['pf', 'pj'] })
  @IsEnum(['pf', 'pj'], { message: 'Tipo de pessoa deve ser pf ou pj' })
  personType: 'pf' | 'pj';

  @ApiPropertyOptional({ example: '(11) 99999-8888' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressStreet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressComplement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressNeighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressCity?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  addressState?: string;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsOptional()
  @IsString()
  addressZip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
