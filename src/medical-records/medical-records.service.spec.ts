import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from '../appointments/appointments.service';
import { PetsService } from '../pets/pets.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { MedicalRecordsRepository } from './medical-records.repository';
import { MedicalRecordsService } from './medical-records.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService;
  let repository: jest.Mocked<MedicalRecordsRepository>;
  let appointmentsService: jest.Mocked<AppointmentsService>;
  let petsService: jest.Mocked<PetsService>;

  const mockAppointment = {
    id: 'appointment-id',
    status: AppointmentStatus.SCHEDULED,
    petId: 'pet-id',
    guardianId: 'guardian-id',
    veterinarianId: 'vet-id',
  };

  const mockRecord = {
    id: 'record-id',
    diagnosis: 'Otite externa',
    observations: 'Secreção leve',
    procedures: 'Limpeza auricular',
    prescriptions: 'Gotas otológicas',
    appointmentId: 'appointment-id',
    petId: 'pet-id',
    veterinarianId: 'vet-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      findByAppointmentId: jest.fn(),
      createAndCompleteAppointment: jest.fn(),
      findAllByPet: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as never;

    appointmentsService = {
      findOne: jest.fn(),
    } as never;

    petsService = {
      findOne: jest.fn(),
    } as never;

    service = new MedicalRecordsService(
      repository,
      appointmentsService,
      petsService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateMedicalRecordDto = {
      appointmentId: 'appointment-id',
      diagnosis: '  Otite externa  ',
      observations: '  Secreção leve  ',
      procedures: '  Limpeza auricular  ',
      prescriptions: '  Gotas otológicas  ',
    };

    it('creates medical record and completes appointment when valid', async () => {
      appointmentsService.findOne.mockResolvedValue(mockAppointment as never);
      repository.findByAppointmentId.mockResolvedValue(null);
      repository.createAndCompleteAppointment.mockResolvedValue(
        mockRecord as never,
      );

      const result = await service.create(createDto);

      expect(appointmentsService.findOne).toHaveBeenCalledWith(
        'appointment-id',
      );
      expect(repository.findByAppointmentId).toHaveBeenCalledWith(
        'appointment-id',
      );
      expect(repository.createAndCompleteAppointment).toHaveBeenCalledWith({
        appointmentId: 'appointment-id',
        petId: 'pet-id',
        veterinarianId: 'vet-id',
        diagnosis: 'Otite externa',
        observations: 'Secreção leve',
        procedures: 'Limpeza auricular',
        prescriptions: 'Gotas otológicas',
      });
      expect(result).toEqual(mockRecord);
    });

    it('throws BadRequestException when appointment is canceled', async () => {
      appointmentsService.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELED,
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'Não é possível registrar atendimento para uma consulta cancelada.',
        ),
      );

      expect(repository.createAndCompleteAppointment).not.toHaveBeenCalled();
    });

    it('throws ConflictException when appointment already has a medical record', async () => {
      appointmentsService.findOne.mockResolvedValue(mockAppointment as never);
      repository.findByAppointmentId.mockResolvedValue(mockRecord as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new ConflictException(
          'Esta consulta já possui um atendimento registrado.',
        ),
      );

      expect(repository.createAndCompleteAppointment).not.toHaveBeenCalled();
    });

    it('throws ConflictException when appointment status is already COMPLETED', async () => {
      appointmentsService.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      } as never);
      repository.findByAppointmentId.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toEqual(
        new ConflictException(
          'Esta consulta já possui um atendimento registrado.',
        ),
      );
    });
  });

  describe('findByPet', () => {
    it('validates pet existence and returns paginated medical records', async () => {
      petsService.findOne.mockResolvedValue({ id: 'pet-id' } as never);
      repository.findAllByPet.mockResolvedValue({
        items: [mockRecord] as never,
        total: 1,
      });

      const result = await service.findByPet('pet-id', 1, 10);

      expect(petsService.findOne).toHaveBeenCalledWith('pet-id');
      expect(repository.findAllByPet).toHaveBeenCalledWith('pet-id', 0, 10);
      expect(result).toEqual({
        data: [mockRecord],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('returns the medical record when found', async () => {
      repository.findOne.mockResolvedValue(mockRecord as never);

      const result = await service.findOne('record-id');

      expect(repository.findOne).toHaveBeenCalledWith('record-id');
      expect(result).toEqual(mockRecord);
    });

    it('throws NotFoundException when medical record does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toEqual(
        new NotFoundException('Prontuário não encontrado.'),
      );
    });
  });

  describe('update', () => {
    it('validates existence and updates trimmed clinical fields', async () => {
      const updatedRecord = {
        ...mockRecord,
        diagnosis: 'Otite fúngica',
      };
      repository.findOne.mockResolvedValue(mockRecord as never);
      repository.update.mockResolvedValue(updatedRecord as never);

      const result = await service.update('record-id', {
        diagnosis: '  Otite fúngica  ',
      });

      expect(repository.findOne).toHaveBeenCalledWith('record-id');
      expect(repository.update).toHaveBeenCalledWith('record-id', {
        diagnosis: 'Otite fúngica',
      });
      expect(result).toEqual(updatedRecord);
    });

    it('throws NotFoundException when updating a non-existent record', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { diagnosis: 'Novo diagnóstico' }),
      ).rejects.toEqual(new NotFoundException('Prontuário não encontrado.'));

      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});