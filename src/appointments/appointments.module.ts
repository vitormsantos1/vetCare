import { Module } from '@nestjs/common';
import { GuardiansModule } from '../guardians/guardians.module';
import { PetsModule } from '../pets/pets.module';
import { VeterinariansModule } from '../veterinarians/veterinarians.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [PrismaModule, PetsModule, GuardiansModule, VeterinariansModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}