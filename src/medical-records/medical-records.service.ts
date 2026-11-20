import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from '../appointments/appointments.service';
import { PetsService } from '../pets/pets.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordsRepository } from './medical-records.repository';

const MAX_LIMIT = 100;

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly medicalRecordsRepository: MedicalRecordsRepository,
    private readonly appointmentsService: AppointmentsService,
    private readonly petsService: PetsService,
  ) {}

  async create(dto: CreateMedicalRecordDto) {
    const appointment = await this.appointmentsService.findOne(
      dto.appointmentId,
    );

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(
        'Não é possível registrar atendimento para uma consulta cancelada.',
      );
    }

    const existingRecord =
      await this.medicalRecordsRepository.findByAppointmentId(
        dto.appointmentId,
      );
    if (
      existingRecord ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new ConflictException(
        'Esta consulta já possui um atendimento registrado.',
      );
    }

    return this.medicalRecordsRepository.createAndCompleteAppointment({
      appointmentId: appointment.id,
      petId: appointment.petId,
      veterinarianId: appointment.veterinarianId,
      diagnosis: dto.diagnosis.trim(),
      observations: dto.observations?.trim(),
      procedures: dto.procedures?.trim(),
      prescriptions: dto.prescriptions?.trim(),
    });
  }

  async findByPet(petId: string, page: number, limit: number) {
    await this.petsService.findOne(petId);

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    const { items, total } = await this.medicalRecordsRepository.findAllByPet(
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
    const record = await this.medicalRecordsRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Prontuário não encontrado.');
    }
    return record;
  }

  async update(id: string, dto: UpdateMedicalRecordDto) {
    await this.findOne(id);

    return this.medicalRecordsRepository.update(id, {
      ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis.trim() }),
      ...(dto.observations !== undefined && {
        observations: dto.observations.trim(),
      }),
      ...(dto.procedures !== undefined && {
        procedures: dto.procedures.trim(),
      }),
      ...(dto.prescriptions !== undefined && {
        prescriptions: dto.prescriptions.trim(),
      }),
    });
  }
}