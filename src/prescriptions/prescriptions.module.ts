import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PetsModule } from '../pets/pets.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsRepository } from './prescriptions.repository';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  imports: [PrismaModule, AppointmentsModule, PetsModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionsRepository],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}