import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateVaccinationDto {
  @ApiProperty({ example: 'V10 (Óctupla/Déctupla Canina)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  vaccineName!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  petId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  veterinarianId!: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Opcional: vincula a vacinação a uma consulta específica',
  })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'LOTE-2026-A91' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  batch?: string;

  @ApiPropertyOptional({
    example: '2026-11-24T19:00:00.000Z',
    description: 'Se omitida, utiliza a data/hora atual',
  })
  @IsOptional()
  @IsDateString()
  appliedAt?: string;

  @ApiPropertyOptional({
    example: '2026-12-15T19:00:00.000Z',
    description: 'Previsão para dose de reforço ou revacinação anual',
  })
  @IsOptional()
  @IsDateString()
  nextDoseAt?: string;

  @ApiPropertyOptional({
    example: 'Primeira dose do protocolo inicial. Sem reações imediatas.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}