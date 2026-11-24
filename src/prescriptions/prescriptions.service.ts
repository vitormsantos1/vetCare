import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from '../appointments/appointments.service';
import { PetsService } from '../pets/pets.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionsRepository } from './prescriptions.repository';

const MAX_LIMIT = 100;

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prescriptionsRepository: PrescriptionsRepository,
    private readonly appointmentsService: AppointmentsService,
    private readonly petsService: PetsService,
  ) {}

  async create(dto: CreatePrescriptionDto) {
    const appointment = await this.appointmentsService.findOne(
      dto.appointmentId,
    );

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(
        'Não é possível emitir prescrição para uma consulta cancelada.',
      );
    }

    const validUntil = dto.validUntil
      ? this.parseFutureDate(dto.validUntil, 'validUntil')
      : undefined;

    return this.prescriptionsRepository.create({
      appointmentId: appointment.id,
      petId: appointment.petId,
      veterinarianId: appointment.veterinarianId,
      medications: dto.medications.trim(),
      ...(dto.instructions !== undefined && {
        instructions: dto.instructions.trim(),
      }),
      ...(validUntil !== undefined && { validUntil }),
    });
  }

  async findByAppointment(appointmentId: string) {
    await this.appointmentsService.findOne(appointmentId);
    return this.prescriptionsRepository.findAllByAppointment(appointmentId);
  }

  async findByPet(petId: string, page: number, limit: number) {
    await this.petsService.findOne(petId);

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    const { items, total } = await this.prescriptionsRepository.findAllByPet(
      petId,
      (safePage - 1) * safeLimit,
      safeLimit,
    );

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
    const prescription = await this.prescriptionsRepository.findOne(id);
    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada.');
    }
    return prescription;
  }

  async update(id: string, dto: UpdatePrescriptionDto) {
    await this.findOne(id);

    const validUntil = dto.validUntil
      ? this.parseFutureDate(dto.validUntil, 'validUntil')
      : undefined;

    return this.prescriptionsRepository.update(id, {
      ...(dto.medications !== undefined && {
        medications: dto.medications.trim(),
      }),
      ...(dto.instructions !== undefined && {
        instructions: dto.instructions.trim(),
      }),
      ...(validUntil !== undefined && { validUntil }),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prescriptionsRepository.remove(id);
    return { message: 'Prescrição removida com sucesso.' };
  }

  private parseFutureDate(value: string, fieldName: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
      throw new BadRequestException(
        `A data informada em "${fieldName}" deve estar no futuro.`,
      );
    }
    return parsed;
  }
}