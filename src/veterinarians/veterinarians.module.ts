import { Module } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { VeterinariansRepository } from './veterinarians.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [VeterinariansController],
  providers: [VeterinariansService, VeterinariansRepository, PrismaService],
  exports: [VeterinariansRepository],
})
export class VeterinariansModule {}
