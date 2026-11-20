import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelAppointmentDto {
  @ApiPropertyOptional({ example: 'Tutor solicitou remarcação por imprevisto' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}