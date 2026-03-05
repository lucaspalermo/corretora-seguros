import { IsString, IsOptional, IsNumber, Min, Max, MinLength, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSellerDto {
  @ApiProperty({ example: 'Carlos Vendedor' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  cpf: string;

  @ApiProperty({ example: 10.0, description: 'Percentual padrao de comissao' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  defaultCommissionPct: number;

  @ApiPropertyOptional({ example: 12.5, description: 'Percentual diferenciado' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  specialCommissionPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'ID do usuario vinculado (se tiver acesso ao sistema)' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
