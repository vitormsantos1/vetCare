import { Module } from '@nestjs/common';
import { AppointmentsModule } from 'src/appointments/appointments.module'; 
import { PetsModule } from 'src/pets/pets.module'; 
import { PrismaModule } from 'src/prisma/prisma.module';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsRepository } from './medical-records.repository';
import { MedicalRecordsService } from './medical-records.service';

@Module({
  imports: [PrismaModule, AppointmentsModule, PetsModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, MedicalRecordsRepository],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}