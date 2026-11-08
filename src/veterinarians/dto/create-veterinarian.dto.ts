import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVeterinarianDto {
  @ApiProperty({ example: 'CRMV-BA 12345' })
  @IsNotEmpty()
  @IsString()
  crmv!: string;

  @ApiProperty({ example: 'uuid-do-usuario-aqui' })
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'Ortopedia', required: false })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({ example: '71999999999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}