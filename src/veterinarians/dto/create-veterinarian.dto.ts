import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVeterinarianDto {
  @ApiProperty({
    description: 'Nome completo do veterinário',
    example: 'Fulano sicrano',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Email do veterinário',
    example: 'vet@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Senha do veterinario',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'crmv do veterinário',
    example: 'CRMV-BA 12345',
  })
  @IsNotEmpty()
  @IsString()
  crmv!: string;

  @ApiProperty({
    description: 'Especialidade do veterinário',
    example: 'Ortopedia',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({
    description: 'Número do veterinário',
    example: '71999999999',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
