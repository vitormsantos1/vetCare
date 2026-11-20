import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2026-11-25T14:30:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  petId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  guardianId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  veterinarianId!: string;

  @ApiPropertyOptional({ example: 'Consulta de rotina e reforço vacinal' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}