import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PetsRepository } from './pets.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { GuardiansModule } from '../guardians/guardians.module';

@Module({
  imports: [GuardiansModule],
  controllers: [PetsController],
  providers: [PetsService, PetsRepository, PrismaService],
})
export class PetsModule {}
