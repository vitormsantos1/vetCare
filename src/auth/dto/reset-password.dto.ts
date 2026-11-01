import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Nova senha' })
  @IsString()
  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  newPassword!: string;
}
