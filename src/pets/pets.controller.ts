import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Pets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post('guardians/:guardianId/pets')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  create(
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
    @Body() createPetDto: CreatePetDto,
  ) {
    return this.petsService.create(guardianId, createPetDto);
  }

  @Get('guardians/:guardianId/pets')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  findByGuardian(
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.petsService.findByGuardian(guardianId, page, limit, search);
  }

  @Get('pets')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.petsService.findAll(page, limit, search);
  }

  @Get('pets/:id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.petsService.findOne(id);
  }

  @Patch('pets/:id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(id, updatePetDto);
  }

  @Delete('pets/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.petsService.remove(id);
  }
}
