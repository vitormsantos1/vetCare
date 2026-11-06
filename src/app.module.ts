import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GuardiansModule } from './guardians/guardians.module';
import { PetsModule } from './pets/pets.module';

@Module({
  imports: [UsersModule, AuthModule, ConfigModule.forRoot({ isGlobal: true }), GuardiansModule, PetsModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
