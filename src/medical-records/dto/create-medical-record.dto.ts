import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMedicalRecordDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  appointmentId!: string;

  @ApiProperty({ example: 'Otite externa bacteriana bilateral' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  diagnosis!: string;

  @ApiPropertyOptional({
    example: 'Animal apresentou prurido intenso e secreção auricular.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;

  @ApiPropertyOptional({
    example: 'Limpeza otológica e coleta de material para citologia.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  procedures?: string;

  @ApiPropertyOptional({
    example: 'Solução otológica 5 gotas a cada 12h por 10 dias.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prescriptions?: string;
}