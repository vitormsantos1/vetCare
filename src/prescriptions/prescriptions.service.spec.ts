import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from '../appointments/appointments.service';
import { PetsService } from '../pets/pets.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsRepository } from './prescriptions.repository';
import { PrescriptionsService } from './prescriptions.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let repository: jest.Mocked<PrescriptionsRepository>;
  let appointmentsService: jest.Mocked<AppointmentsService>;
  let petsService: jest.Mocked<PetsService>;

  const futureIso = new Date(Date.now() + 7 * 86_400_000).toISOString();

  const mockAppointment = {
    id: 'appointment-id',
    status: AppointmentStatus.COMPLETED,
    petId: 'pet-id',
    guardianId: 'guardian-id',
    veterinarianId: 'vet-id',
  };

  const mockPrescription = {
    id: 'prescription-id',
    medications: 'Amoxicilina 250mg - 1 cp a cada 12h por 10 dias',
    instructions: 'Administrar com alimento',
    validUntil: new Date(futureIso),
    appointmentId: 'appointment-id',
    petId: 'pet-id',
    veterinarianId: 'vet-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAllByAppointment: jest.fn(),
      findAllByPet: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    appointmentsService = {
      findOne: jest.fn(),
    } as never;

    petsService = {
      findOne: jest.fn(),
    } as never;

    service = new PrescriptionsService(
      repository,
      appointmentsService,
      petsService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePrescriptionDto = {
      appointmentId: 'appointment-id',
      medications: '  Amoxicilina 250mg - 1 cp a cada 12h por 10 dias  ',
      instructions: '  Administrar com alimento  ',
      validUntil: futureIso,
    };

    it('extracts pet and veterinarian from appointment and creates prescription', async () => {
      appointmentsService.findOne.mockResolvedValue(mockAppointment as never);
      repository.create.mockResolvedValue(mockPrescription as never);

      const result = await service.create(createDto);

      expect(appointmentsService.findOne).toHaveBeenCalledWith(
        'appointment-id',
      );
      expect(repository.create).toHaveBeenCalledWith({
        appointmentId: 'appointment-id',
        petId: 'pet-id',
        veterinarianId: 'vet-id',
        medications: 'Amoxicilina 250mg - 1 cp a cada 12h por 10 dias',
        instructions: 'Administrar com alimento',
        validUntil: new Date(futureIso),
      });
      expect(result).toEqual(mockPrescription);
    });

    it('throws BadRequestException when appointment is canceled', async () => {
      appointmentsService.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELED,
      } as never);

      await expect(service.create(createDto)).rejects.toEqual(
        new BadRequestException(
          'Não é possível emitir prescrição para uma consulta cancelada.',
        ),
      );

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when validUntil is in the past', async () => {
      appointmentsService.findOne.mockResolvedValue(mockAppointment as never);
      const pastIso = new Date(Date.now() - 60_000).toISOString();

      await expect(
        service.create({ ...createDto, validUntil: pastIso }),
      ).rejects.toEqual(
        new BadRequestException(
          'A data informada em "validUntil" deve estar no futuro.',
        ),
      );

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByAppointment', () => {
    it('validates appointment existence and returns its prescriptions', async () => {
      appointmentsService.findOne.mockResolvedValue(mockAppointment as never);
      repository.findAllByAppointment.mockResolvedValue([
        mockPrescription,
      ] as never);

      const result = await service.findByAppointment('appointment-id');

      expect(appointmentsService.findOne).toHaveBeenCalledWith(
        'appointment-id',
      );
      expect(repository.findAllByAppointment).toHaveBeenCalledWith(
        'appointment-id',
      );
      expect(result).toEqual([mockPrescription]);
    });
  });

  describe('findByPet', () => {
    it('validates pet existence and returns paginated prescriptions', async () => {
      petsService.findOne.mockResolvedValue({ id: 'pet-id' } as never);
      repository.findAllByPet.mockResolvedValue({
        items: [mockPrescription] as never,
        total: 1,
      });

      const result = await service.findByPet('pet-id', 1, 10);

      expect(petsService.findOne).toHaveBeenCalledWith('pet-id');
      expect(repository.findAllByPet).toHaveBeenCalledWith('pet-id', 0, 10);
      expect(result).toEqual({
        data: [mockPrescription],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('returns the prescription when found', async () => {
      repository.findOne.mockResolvedValue(mockPrescription as never);

      const result = await service.findOne('prescription-id');

      expect(repository.findOne).toHaveBeenCalledWith('prescription-id');
      expect(result).toEqual(mockPrescription);
    });

    it('throws NotFoundException when prescription does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toEqual(
        new NotFoundException('Prescrição não encontrada.'),
      );
    });
  });

  describe('update', () => {
    it('validates existence and updates trimmed fields', async () => {
      const updated = {
        ...mockPrescription,
        medications: 'Cefalexina 500mg',
      };
      repository.findOne.mockResolvedValue(mockPrescription as never);
      repository.update.mockResolvedValue(updated as never);

      const result = await service.update('prescription-id', {
        medications: '  Cefalexina 500mg  ',
      });

      expect(repository.update).toHaveBeenCalledWith('prescription-id', {
        medications: 'Cefalexina 500mg',
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when prescription does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { medications: 'Novo medicamento' }),
      ).rejects.toEqual(new NotFoundException('Prescrição não encontrada.'));

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes the prescription when found', async () => {
      repository.findOne.mockResolvedValue(mockPrescription as never);
      repository.remove.mockResolvedValue(mockPrescription as never);

      const result = await service.remove('prescription-id');

      expect(repository.remove).toHaveBeenCalledWith('prescription-id');
      expect(result).toEqual({ message: 'Prescrição removida com sucesso.' });
    });
  });
});