import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
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
import { AppointmentStatus, Role } from '@prisma/client';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Agenda uma nova consulta veterinária (REQ 07)' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  @ApiOperation({
    summary: 'Consulta a agenda por dia, semana ou veterinário (REQ 09)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'date', required: false, example: '2026-11-25' })
  @ApiQuery({ name: 'weekStart', required: false, example: '2026-11-23' })
  @ApiQuery({ name: 'veterinarianId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('date') date?: string,
    @Query('weekStart') weekStart?: string,
    @Query('veterinarianId', new ParseUUIDPipe({ optional: true }))
    veterinarianId?: string,
    @Query('status', new ParseEnumPipe(AppointmentStatus, { optional: true }))
    status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll({
      page,
      limit,
      date,
      weekStart,
      veterinarianId,
      status,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  @ApiOperation({ summary: 'Busca os detalhes de uma consulta pelo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  @ApiOperation({ summary: 'Cancela uma consulta agendada (REQ 08)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelAppointmentDto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(id, cancelAppointmentDto);
  }
}