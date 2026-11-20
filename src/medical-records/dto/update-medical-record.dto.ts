import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMedicalRecordDto {
  @ApiPropertyOptional({ example: 'Otite externa fúngica confirmada' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Retorno agendado em 14 dias para reavaliação.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;

  @ApiPropertyOptional({ example: 'Limpeza otológica profunda.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  procedures?: string;

  @ApiPropertyOptional({ example: 'Antifúngico tópico 2x ao dia por 14 dias.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prescriptions?: string;
}