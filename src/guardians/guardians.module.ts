import { Module } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import { GuardiansController } from './guardians.controller';
import { GuardiansRepository } from './guardians.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GuardiansController],
  providers: [GuardiansService, GuardiansRepository, PrismaService],
  exports: [GuardiansRepository, GuardiansService],
})
export class GuardiansModule {}
