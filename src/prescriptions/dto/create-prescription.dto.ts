import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePrescriptionDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID da consulta à qual a prescrição está vinculada',
  })
  @IsUUID()
  appointmentId!: string;

  @ApiProperty({
    example:
      '1. Amoxicilina + Clavulanato 250mg — 1 comprimido a cada 12h por 10 dias.\n2. Meloxicam 2mg — 1 comprimido a cada 24h por 5 dias.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  medications!: string;

  @ApiPropertyOptional({
    example: 'Administrar junto com alimentação. Retornar após término.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;

  @ApiPropertyOptional({
    example: '2026-12-24T23:59:59.000Z',
    description: 'Data limite de validade da receita',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}