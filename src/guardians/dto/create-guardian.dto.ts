import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateGuardianDto {
  @ApiProperty({
    description: 'Nome do tutor',
    example: 'Fulano sicrano',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'cpf do tutor',
    example: '90312423111',
  })
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'CPF inválido' })
  cpf!: string;

  @ApiProperty({
    description: 'Email do tutor',
    example: 'Fulanosicrano@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Telefone do tutor',
    example: '77990876534',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
