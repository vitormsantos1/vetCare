import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Status } from '@prisma/client';
import { GuardiansService } from '../guardians/guardians.service';
import { PetsService } from '../pets/pets.service';
import { VeterinariansService } from '../veterinarians/veterinarians.service';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

/* eslint-disable @typescript-eslint/unbound-method */

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: jest.Mocked<AppointmentsRepository>;
  let petsService: jest.Mocked<PetsService>;
  let guardiansService: jest.Mocked<GuardiansService>;
  let veterinariansService: jest.Mocked<VeterinariansService>;

  const futureIso = new Date(Date.now() + 86_400_000).toISOString();

  const mockGuardian = {
    id: 'guardian-id',
    name: 'Maria Silva',
    status: Status.ACTIVE,
  };

  const mockPet = {
    id: 'pet-id',
    name: 'Rex',
    guardianId: 'guardian-id',
    status: Status.ACTIVE,
  };

  const mockVet = {
    id: 'vet-id',
    crmv: 'CRMV-BA 1234',
  };

  const mockAppointment = {
    id: 'appointment-id',
    scheduledAt: new Date(futureIso),
    status: AppointmentStatus.SCHEDULED,
    reason: 'Consulta de rotina',
    cancellationReason: null,
    canceledAt: null,
    petId: 'pet-id',
    guardianId: 'guardian-id',
    veterinarianId: 'vet-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findConflictingAppointment: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
    } as never;

    petsService = {
      findOne: jest.fn(),
    } as never;

    guardiansService = {
      findOne: jest.fn(),
    } as never;

    veterinariansService = {
      findOne: jest.fn(),
    } as never;

    service = new AppointmentsService(
      repository,
      petsService,
      guardiansService,
      veterinariansService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateAppointmentDto = {
      scheduledAt: futureIso,
      petId: 'pet-id',
      guardianId: 'guardian-id',
      veterinarianId: 'vet-id',
      reason: '  Consulta de rotina  ',
    };

    it('validates entities, checks schedule availability, and creates an appointment', async () => {
      guardiansService.findOne.mockResolvedValue(mockGuardian as never);
      petsService.findOne.mockResolvedValue(mockPet as never);
      veterinariansService.findOne.mockResolvedValue(mockVet as never);
      repository.findConflictingAppointment.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockAppointment as never);

      const result = await service.create(createDto);

      expect(guardiansService.findOne).toHaveBeenCalledWith('guardian-id');
      expect(petsService.findOne).toHaveBeenCalledWith('pet-id');
      expect(veterinariansService.findOne).toHaveBeenCalledWith('vet-id');
      expect(repository.findConflictingAppointment).toHaveBeenCalledWith(
        'vet-id',
        new Date(futureIso),
      );
      expect(repository.create).toHaveBeenCalledWith({
        scheduledAt: new Date(futureIso),
        petId: 'pet-id',
        guardianId: 'guardian-id',
        veterinarianId: 'vet-id',
        reason: 'Consulta de rotina',
      });
      expect(result).toEqual(mockAppointment);
    });

    it('throws BadRequestException when scheduledAt is in the past', async () => {
      const pastIso = new Date(Date.now() - 60_000).toISOString();

      await expect(
        service.create({ ...createDto, scheduledAt: pastIso }),
      ).rejects.toEqual(
        new BadRequestException(
          'A data e horário da consulta devem estar no futuro.',
        ),
      );

      expect(guardiansService.findOne).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when guardian is inactive', async () => {
      guardiansService.findOne.mockResolvedValue({
        ...mockGuardian,
        status: Status.INACTIVE,
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'Não é possível agendar consulta para um tutor inativo.',
        ),
      );

      expect(petsService.findOne).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when pet does not belong to guardian', async () => {
      guardiansService.findOne.mockResolvedValue(mockGuardian as never);
      petsService.findOne.mockResolvedValue({
        ...mockPet,
        guardianId: 'other-guardian-id',
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'O pet informado não pertence ao tutor selecionado.',
        ),
      );

      expect(veterinariansService.findOne).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when pet is inactive', async () => {
      guardiansService.findOne.mockResolvedValue(mockGuardian as never);
      petsService.findOne.mockResolvedValue({
        ...mockPet,
        status: Status.INACTIVE,
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'Não é possível agendar consulta para um pet inativo.',
        ),
      );
    });

    it('throws ConflictException when veterinarian already has a scheduled appointment at that time', async () => {
      guardiansService.findOne.mockResolvedValue(mockGuardian as never);
      petsService.findOne.mockResolvedValue(mockPet as never);
      veterinariansService.findOne.mockResolvedValue(mockVet as never);
      repository.findConflictingAppointment.mockResolvedValue(
        mockAppointment as never,
      );

      await expect(service.create(createDto)).rejects.toEqual(
        new ConflictException(
          'O veterinário já possui uma consulta agendada para este horário.',
        ),
      );

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filters schedule by a single day and returns paginated response', async () => {
      repository.findAll.mockResolvedValue({
        items: [mockAppointment] as never,
        total: 1,
      });

      const result = await service.findAll({
        page: 1,
        limit: 10,
        date: '2026-11-25',
        veterinarianId: 'vet-id',
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        startDate: new Date('2026-11-25T00:00:00.000Z'),
        endDate: new Date('2026-11-25T23:59:59.999Z'),
        veterinarianId: 'vet-id',
        status: undefined,
      });
      expect(result).toEqual({
        data: [mockAppointment],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('filters schedule by a 7-day week starting on weekStart', async () => {
      repository.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({
        page: 1,
        limit: 20,
        weekStart: '2026-11-23',
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        startDate: new Date('2026-11-23T00:00:00.000Z'),
        endDate: new Date('2026-11-29T23:59:59.999Z'),
        veterinarianId: undefined,
        status: undefined,
      });
    });

    it('throws BadRequestException when both date and weekStart are provided', async () => {
      await expect(
        service.findAll({
          page: 1,
          limit: 10,
          date: '2026-11-25',
          weekStart: '2026-11-23',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when date format is invalid', async () => {
      await expect(
        service.findAll({
          page: 1,
          limit: 10,
          date: '25/11/2026',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns the appointment when found', async () => {
      repository.findOne.mockResolvedValue(mockAppointment as never);

      const result = await service.findOne('appointment-id');

      expect(repository.findOne).toHaveBeenCalledWith('appointment-id');
      expect(result).toEqual(mockAppointment);
    });

    it('throws NotFoundException when appointment does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toEqual(
        new NotFoundException('Consulta não encontrada.'),
      );
    });
  });

  describe('cancel', () => {
    it('cancels a scheduled appointment and trims cancellationReason', async () => {
      const canceledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELED,
        cancellationReason: 'Imprevisto',
      };
      repository.findOne.mockResolvedValue(mockAppointment as never);
      repository.cancel.mockResolvedValue(canceledAppointment as never);

      const result = await service.cancel('appointment-id', {
        cancellationReason: '  Imprevisto  ',
      });

      expect(repository.cancel).toHaveBeenCalledWith(
        'appointment-id',
        'Imprevisto',
      );
      expect(result).toEqual(canceledAppointment);
    });

    it('throws BadRequestException when appointment is already canceled', async () => {
      repository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELED,
      } as never);

      await expect(service.cancel('appointment-id', {})).rejects.toEqual(
        new BadRequestException('Esta consulta já está cancelada.'),
      );

      expect(repository.cancel).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when appointment is already completed', async () => {
      repository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      } as never);

      await expect(service.cancel('appointment-id', {})).rejects.toEqual(
        new BadRequestException(
          'Não é possível cancelar uma consulta já concluída.',
        ),
      );

      expect(repository.cancel).not.toHaveBeenCalled();
    });
  });
});