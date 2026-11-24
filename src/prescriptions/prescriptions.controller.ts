import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
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
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({
    summary: 'Emite uma prescrição vinculada ao atendimento (REQ 13)',
  })
  create(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(createPrescriptionDto);
  }

  @Get('appointment/:appointmentId')
  @Roles(Role.ADMIN, Role.VET, Role.RECEPTIONIST)
  @ApiOperation({
    summary: 'Lista todas as prescrições emitidas em uma consulta (REQ 13)',
  })
  findByAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.prescriptionsService.findByAppointment(appointmentId);
  }

  @Get('pet/:petId')
  @Roles(Role.ADMIN, Role.VET, Role.RECEPTIONIST)
  @ApiOperation({
    summary: 'Consulta o histórico de prescrições de um animal (REQ 13)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findByPet(
    @Param('petId', ParseUUIDPipe) petId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.prescriptionsService.findByPet(petId, page, limit);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.VET, Role.RECEPTIONIST)
  @ApiOperation({
    summary: 'Busca uma prescrição completa pelo ID para visualização/impressão',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({
    summary: 'Atualiza medicamentos, orientações ou validade da prescrição',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionsService.update(id, updatePrescriptionDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({ summary: 'Remove uma prescrição' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptionsService.remove(id);
  }
}