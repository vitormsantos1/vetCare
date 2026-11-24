import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, Status } from '@prisma/client';
import { AppointmentsService } from '../appointments/appointments.service';
import { PetsService } from '../pets/pets.service';
import { VeterinariansService } from '../veterinarians/veterinarians.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { VaccinationsRepository } from './vaccinations.repository';
import { VaccinationsService } from './vaccinations.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('VaccinationsService', () => {
  let service: VaccinationsService;
  let repository: jest.Mocked<VaccinationsRepository>;
  let petsService: jest.Mocked<PetsService>;
  let veterinariansService: jest.Mocked<VeterinariansService>;
  let appointmentsService: jest.Mocked<AppointmentsService>;

  const appliedIso = '2026-11-24T19:00:00.000Z';
  const nextDoseIso = '2026-12-15T19:00:00.000Z';

  const mockPet = {
    id: 'pet-id',
    name: 'Rex',
    status: Status.ACTIVE,
  };

  const mockVet = {
    id: 'vet-id',
    crmv: 'CRMV-BA 1234',
  };

  const mockAppointment = {
    id: 'appointment-id',
    petId: 'pet-id',
    status: AppointmentStatus.SCHEDULED,
  };

  const mockVaccination = {
    id: 'vaccination-id',
    vaccineName: 'V10',
    batch: 'LOTE-01',
    appliedAt: new Date(appliedIso),
    nextDoseAt: new Date(nextDoseIso),
    notes: 'Sem reações',
    petId: 'pet-id',
    veterinarianId: 'vet-id',
    appointmentId: 'appointment-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAllByPet: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    petsService = {
      findOne: jest.fn(),
    } as never;

    veterinariansService = {
      findOne: jest.fn(),
    } as never;

    appointmentsService = {
      findOne: jest.fn(),
    } as never;

    service = new VaccinationsService(
      repository,
      petsService,
      veterinariansService,
      appointmentsService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateVaccinationDto = {
      vaccineName: '  V10  ',
      petId: 'pet-id',
      veterinarianId: 'vet-id',
      appointmentId: 'appointment-id',
      batch: '  LOTE-01  ',
      appliedAt: appliedIso,
      nextDoseAt: nextDoseIso,
      notes: '  Sem reações  ',
    };

    it('validates pet, vet, appointment and dates before creating vaccination', async () => {
      petsService.findOne.mockResolvedValue(mockPet as never);
      veterinariansService.findOne.mockResolvedValue(mockVet as never);
      appointmentsService.findOne.mockResolvedValue(mockAppointment as never);
      repository.create.mockResolvedValue(mockVaccination as never);

      const result = await service.create(createDto);

      expect(petsService.findOne).toHaveBeenCalledWith('pet-id');
      expect(veterinariansService.findOne).toHaveBeenCalledWith('vet-id');
      expect(appointmentsService.findOne).toHaveBeenCalledWith(
        'appointment-id',
      );
      expect(repository.create).toHaveBeenCalledWith({
        vaccineName: 'V10',
        petId: 'pet-id',
        veterinarianId: 'vet-id',
        appointmentId: 'appointment-id',
        batch: 'LOTE-01',
        appliedAt: new Date(appliedIso),
        nextDoseAt: new Date(nextDoseIso),
        notes: 'Sem reações',
      });
      expect(result).toEqual(mockVaccination);
    });

    it('creates standalone vaccination without appointmentId', async () => {
      petsService.findOne.mockResolvedValue(mockPet as never);
      veterinariansService.findOne.mockResolvedValue(mockVet as never);
      repository.create.mockResolvedValue({
        ...mockVaccination,
        appointmentId: null,
      } as never);

      await service.create({
        vaccineName: 'Antirrábica',
        petId: 'pet-id',
        veterinarianId: 'vet-id',
        appliedAt: appliedIso,
      });

      expect(appointmentsService.findOne).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        vaccineName: 'Antirrábica',
        petId: 'pet-id',
        veterinarianId: 'vet-id',
        appliedAt: new Date(appliedIso),
      });
    });

    it('throws BadRequestException when pet is inactive', async () => {
      petsService.findOne.mockResolvedValue({
        ...mockPet,
        status: Status.INACTIVE,
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'Não é possível registrar vacinação para um pet inativo.',
        ),
      );

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when appointment belongs to a different pet', async () => {
      petsService.findOne.mockResolvedValue(mockPet as never);
      veterinariansService.findOne.mockResolvedValue(mockVet as never);
      appointmentsService.findOne.mockResolvedValue({
        ...mockAppointment,
        petId: 'other-pet-id',
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'A consulta informada pertence a outro animal.',
        ),
      );
    });

    it('throws BadRequestException when appointment is canceled', async () => {
      petsService.findOne.mockResolvedValue(mockPet as never);
      veterinariansService.findOne.mockResolvedValue(mockVet as never);
      appointmentsService.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELED,
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'Não é possível vincular vacinação a uma consulta cancelada.',
        ),
      );
    });

    it('throws BadRequestException when nextDoseAt is not after appliedAt', async () => {
      petsService.findOne.mockResolvedValue(mockPet as never);
      veterinariansService.findOne.mockResolvedValue(mockVet as never);
      appointmentsService.findOne.mockResolvedValue(mockAppointment as never);

      await expect(
        service.create({
          ...createDto,
          nextDoseAt: '2026-11-20T19:00:00.000Z',
        }),
      ).rejects.toEqual(
        new BadRequestException(
          'A previsão da próxima dose deve ser posterior à data de aplicação.',
        ),
      );

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByPet', () => {
    it('validates pet existence and returns paginated vaccination history', async () => {
      petsService.findOne.mockResolvedValue(mockPet as never);
      repository.findAllByPet.mockResolvedValue({
        items: [mockVaccination] as never,
        total: 1,
      });

      const result = await service.findByPet('pet-id', 1, 10);

      expect(petsService.findOne).toHaveBeenCalledWith('pet-id');
      expect(repository.findAllByPet).toHaveBeenCalledWith('pet-id', 0, 10);
      expect(result).toEqual({
        data: [mockVaccination],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('returns the vaccination record when found', async () => {
      repository.findOne.mockResolvedValue(mockVaccination as never);

      const result = await service.findOne('vaccination-id');

      expect(repository.findOne).toHaveBeenCalledWith('vaccination-id');
      expect(result).toEqual(mockVaccination);
    });

    it('throws NotFoundException when vaccination record does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toEqual(
        new NotFoundException('Registro de vacinação não encontrado.'),
      );
    });
  });

  describe('update', () => {
    it('updates vaccination fields and validates nextDoseAt against appliedAt', async () => {
      const updated = { ...mockVaccination, batch: 'LOTE-02' };
      repository.findOne.mockResolvedValue(mockVaccination as never);
      repository.update.mockResolvedValue(updated as never);

      const result = await service.update('vaccination-id', {
        batch: '  LOTE-02  ',
      });

      expect(repository.update).toHaveBeenCalledWith('vaccination-id', {
        batch: 'LOTE-02',
      });
      expect(result).toEqual(updated);
    });

    it('throws BadRequestException when updated nextDoseAt is before appliedAt', async () => {
      repository.findOne.mockResolvedValue(mockVaccination as never);

      await expect(
        service.update('vaccination-id', {
          nextDoseAt: '2026-11-01T19:00:00.000Z',
        }),
      ).rejects.toEqual(
        new BadRequestException(
          'A previsão da próxima dose deve ser posterior à data de aplicação.',
        ),
      );

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes the vaccination record when found', async () => {
      repository.findOne.mockResolvedValue(mockVaccination as never);
      repository.remove.mockResolvedValue(mockVaccination as never);

      const result = await service.remove('vaccination-id');

      expect(repository.remove).toHaveBeenCalledWith('vaccination-id');
      expect(result).toEqual({
        message: 'Registro de vacinação removido com sucesso.',
      });
    });
  });
});