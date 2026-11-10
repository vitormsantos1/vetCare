import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Sex } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({
    description: 'Nome do pet',
    example: 'Rex',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Sexo do pet',
    example: 'MALE',
  })
  @IsEnum(Sex, { message: 'O sexo é inválido' })
  sex!: Sex;

  @ApiProperty({
    description: 'Espécie do pet',
    example: 'cachorro',
  })
  @IsString()
  @IsNotEmpty()
  species!: string;

  @ApiProperty({
    description: 'Data de nascimento do pet',
    example: 'Fulano sicrano',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'A data de nascimento deve estar no formato ISO (ex: 2023-10-15T00:00:00Z)',
    },
  )
  birthDate?: string;

  @ApiProperty({
    description: 'Raça do pet',
    example: 'Golden',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  breed?: string;
}
