import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GuardiansModule } from './guardians/guardians.module';
import { PetsModule } from './pets/pets.module';
import { VeterinariansModule } from './veterinarians/veterinarians.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { VaccinationsModule } from './vaccinations/vaccinations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [UsersModule, AuthModule, ConfigModule.forRoot({ isGlobal: true }), GuardiansModule, PetsModule, VeterinariansModule, AppointmentsModule, MedicalRecordsModule, VaccinationsModule, PrescriptionsModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
