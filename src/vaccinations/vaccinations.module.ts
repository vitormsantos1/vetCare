import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PetsModule } from '../pets/pets.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VeterinariansModule } from '../veterinarians/veterinarians.module';
import { VaccinationsController } from './vaccinations.controller';
import { VaccinationsRepository } from './vaccinations.repository';
import { VaccinationsService } from './vaccinations.service';

@Module({
  imports: [PrismaModule, PetsModule, VeterinariansModule, AppointmentsModule],
  controllers: [VaccinationsController],
  providers: [VaccinationsService, VaccinationsRepository],
  exports: [VaccinationsService],
})
export class VaccinationsModule {}