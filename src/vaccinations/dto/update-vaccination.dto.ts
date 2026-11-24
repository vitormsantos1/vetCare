import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateVaccinationDto {
  @ApiPropertyOptional({ example: 'Antirrábica' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  vaccineName?: string;

  @ApiPropertyOptional({ example: 'LOTE-2026-B44' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  batch?: string;

  @ApiPropertyOptional({ example: '2026-11-24T19:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  appliedAt?: string;

  @ApiPropertyOptional({ example: '2027-11-24T19:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  nextDoseAt?: string;

  @ApiPropertyOptional({ example: 'Reforço anual registrado.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}