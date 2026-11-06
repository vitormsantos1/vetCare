import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateGuardianDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;
}