import { IsString, IsNotEmpty, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { Sex } from '@prisma/client';

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(Sex, { message: 'O sexo é inválido' })
  @IsNotEmpty()
  sex!: Sex;

  @IsDateString({}, { message: 'A data de nascimento deve estar no formato ISO (ex: 2023-10-15T00:00:00Z)' })
  @IsNotEmpty()
  birthDate!: string;

  @IsString()
  @IsNotEmpty()
  breed!: string;

  @IsUUID('all', { message: 'O ID do tutor é inválido' })
  @IsNotEmpty()
  guardianId!: string;
}