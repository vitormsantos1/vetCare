import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Status } from '@prisma/client';
import { AppointmentsService } from '../appointments/appointments.service';
import { PetsService } from '../pets/pets.service';
import { VeterinariansService } from '../veterinarians/veterinarians.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { VaccinationsRepository } from './vaccinations.repository';

const MAX_LIMIT = 100;

@Injectable()
export class VaccinationsService {
  constructor(
    private readonly vaccinationsRepository: VaccinationsRepository,
    private readonly petsService: PetsService,
    private readonly veterinariansService: VeterinariansService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async create(dto: CreateVaccinationDto) {
    const pet = await this.petsService.findOne(dto.petId);
    if (pet.status === Status.INACTIVE) {
      throw new BadRequestException(
        'Não é possível registrar vacinação para um pet inativo.',
      );
    }

    await this.veterinariansService.findOne(dto.veterinarianId);

    if (dto.appointmentId) {
      const appointment = await this.appointmentsService.findOne(
        dto.appointmentId,
      );
      if (appointment.petId !== dto.petId) {
        throw new BadRequestException(
          'A consulta informada pertence a outro animal.',
        );
      }
      if (appointment.status === AppointmentStatus.CANCELED) {
        throw new BadRequestException(
          'Não é possível vincular vacinação a uma consulta cancelada.',
        );
      }
    }

    const appliedAt = dto.appliedAt
      ? this.parseValidDate(dto.appliedAt, 'appliedAt')
      : new Date();

    const nextDoseAt = dto.nextDoseAt
      ? this.parseValidDate(dto.nextDoseAt, 'nextDoseAt')
      : undefined;

    if (nextDoseAt && nextDoseAt <= appliedAt) {
      throw new BadRequestException(
        'A previsão da próxima dose deve ser posterior à data de aplicação.',
      );
    }

    return this.vaccinationsRepository.create({
      vaccineName: dto.vaccineName.trim(),
      petId: dto.petId,
      veterinarianId: dto.veterinarianId,
      ...(dto.appointmentId !== undefined && {
        appointmentId: dto.appointmentId,
      }),
      ...(dto.batch !== undefined && { batch: dto.batch.trim() }),
      appliedAt,
      ...(nextDoseAt !== undefined && { nextDoseAt }),
      ...(dto.notes !== undefined && { notes: dto.notes.trim() }),
    });
  }

  async findByPet(petId: string, page: number, limit: number) {
    await this.petsService.findOne(petId);

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    const { items, total } = await this.vaccinationsRepository.findAllByPet(
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
    const vaccination = await this.vaccinationsRepository.findOne(id);
    if (!vaccination) {
      throw new NotFoundException('Registro de vacinação não encontrado.');
    }
    return vaccination;
  }

  async update(id: string, dto: UpdateVaccinationDto) {
    const existing = await this.findOne(id);

    const appliedAt = dto.appliedAt
      ? this.parseValidDate(dto.appliedAt, 'appliedAt')
      : existing.appliedAt;

    const nextDoseAt = dto.nextDoseAt
      ? this.parseValidDate(dto.nextDoseAt, 'nextDoseAt')
      : undefined;

    const effectiveNextDose = nextDoseAt ?? existing.nextDoseAt;
    if (effectiveNextDose && effectiveNextDose <= appliedAt) {
      throw new BadRequestException(
        'A previsão da próxima dose deve ser posterior à data de aplicação.',
      );
    }

    return this.vaccinationsRepository.update(id, {
      ...(dto.vaccineName !== undefined && {
        vaccineName: dto.vaccineName.trim(),
      }),
      ...(dto.batch !== undefined && { batch: dto.batch.trim() }),
      ...(dto.appliedAt !== undefined && { appliedAt }),
      ...(nextDoseAt !== undefined && { nextDoseAt }),
      ...(dto.notes !== undefined && { notes: dto.notes.trim() }),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.vaccinationsRepository.remove(id);
    return { message: 'Registro de vacinação removido com sucesso.' };
  }

  private parseValidDate(value: string, fieldName: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Data inválida informada em "${fieldName}".`);
    }
    return parsed;
  }
}