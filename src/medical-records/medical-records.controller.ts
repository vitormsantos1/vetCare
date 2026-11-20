import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';

@ApiTags('Medical Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({
    summary: 'Registra o atendimento clínico de uma consulta (REQ 10)',
  })
  create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get('pet/:petId')
  @Roles(Role.ADMIN, Role.VET, Role.RECEPTIONIST)
  @ApiOperation({
    summary: 'Consulta o histórico de prontuários de um pet (REQ 11)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findByPet(
    @Param('petId', ParseUUIDPipe) petId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.medicalRecordsService.findByPet(petId, page, limit);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.VET, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Busca um registro de prontuário pelo ID (REQ 11)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({
    summary: 'Atualiza diagnósticos, procedimentos ou prescrições (REQ 11)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(id, updateMedicalRecordDto);
  }
}