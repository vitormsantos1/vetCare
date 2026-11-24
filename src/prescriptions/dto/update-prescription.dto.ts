import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional({
    example:
      '1. Cefalexina 500mg — 1 comprimido a cada 12h por 14 dias.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  medications?: string;

  @ApiPropertyOptional({
    example: 'Manter colar elizabetano durante todo o tratamento.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;

  @ApiPropertyOptional({
    example: '2026-12-30T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}