import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Status } from '@prisma/client';
import { GuardiansService } from '../guardians/guardians.service';
import { PetsService } from '../pets/pets.service';
import { VeterinariansService } from '../veterinarians/veterinarians.service';
import { AppointmentsRepository } from './appointments.repository';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

const MAX_LIMIT = 100;
const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface ListAppointmentsParams {
  page: number;
  limit: number;
  date?: string;
  weekStart?: string;
  veterinarianId?: string;
  status?: AppointmentStatus;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly petsService: PetsService,
    private readonly guardiansService: GuardiansService,
    private readonly veterinariansService: VeterinariansService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const scheduledDate = new Date(dto.scheduledAt);
    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate <= new Date()
    ) {
      throw new BadRequestException(
        'A data e horário da consulta devem estar no futuro.',
      );
    }

    const guardian = await this.guardiansService.findOne(dto.guardianId);
    if (guardian.status === Status.INACTIVE) {
      throw new BadRequestException(
        'Não é possível agendar consulta para um tutor inativo.',
      );
    }

    const pet = await this.petsService.findOne(dto.petId);
    if (pet.guardianId !== dto.guardianId) {
      throw new BadRequestException(
        'O pet informado não pertence ao tutor selecionado.',
      );
    }
    if (pet.status === Status.INACTIVE) {
      throw new BadRequestException(
        'Não é possível agendar consulta para um pet inativo.',
      );
    }

    await this.veterinariansService.findOne(dto.veterinarianId);

    const conflict =
      await this.appointmentsRepository.findConflictingAppointment(
        dto.veterinarianId,
        scheduledDate,
      );
    if (conflict) {
      throw new ConflictException(
        'O veterinário já possui uma consulta agendada para este horário.',
      );
    }

    return this.appointmentsRepository.create({
      scheduledAt: scheduledDate,
      petId: dto.petId,
      guardianId: dto.guardianId,
      veterinarianId: dto.veterinarianId,
      reason: dto.reason?.trim(),
    });
  }

  async findAll(params: ListAppointmentsParams) {
    const safePage = Math.max(params.page, 1);
    const safeLimit = Math.min(Math.max(params.limit, 1), MAX_LIMIT);
    const { startDate, endDate } = this.resolveDateRange(
      params.date,
      params.weekStart,
    );

    const { items, total } = await this.appointmentsRepository.findAll({
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      startDate,
      endDate,
      veterinarianId: params.veterinarianId,
      status: params.status,
    });

    return {
      data: items,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: string) {
    const appointment = await this.appointmentsRepository.findOne(id);
    if (!appointment) {
      throw new NotFoundException('Consulta não encontrada.');
    }
    return appointment;
  }

  async cancel(id: string, dto: CancelAppointmentDto) {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException('Esta consulta já está cancelada.');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Não é possível cancelar uma consulta já concluída.',
      );
    }

    return this.appointmentsRepository.cancel(
      id,
      dto.cancellationReason?.trim(),
    );
  }

  private resolveDateRange(date?: string, weekStart?: string) {
    if (date && weekStart) {
      throw new BadRequestException(
        'Informe apenas "date" ou "weekStart" para filtrar a agenda.',
      );
    }

    if (date) {
      const startDate = this.parseIsoDateOnly(date, 'date');
      const endDate = new Date(startDate);
      endDate.setUTCHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    if (weekStart) {
      const startDate = this.parseIsoDateOnly(weekStart, 'weekStart');
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 6);
      endDate.setUTCHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    return { startDate: undefined, endDate: undefined };
  }

  private parseIsoDateOnly(value: string, fieldName: string): Date {
    if (!ISO_DATE_ONLY_REGEX.test(value)) {
      throw new BadRequestException(
        `O parâmetro "${fieldName}" deve estar no formato YYYY-MM-DD.`,
      );
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(
        `Data inválida informada em "${fieldName}".`,
      );
    }

    return parsed;
  }
}