import { ApiProperty } from '@nestjs/swagger';
import { Role, Status } from '@prisma/client';
import { Expose } from 'class-transformer';

export class ResponseUserDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty()
  @Expose()
  email!: string;

  @ApiProperty({ enum: Role })
  @Expose()
  role!: Role;

  @Expose()
  status!: Status;
}
