import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('PrescriptionsController', () => {
  let controller: PrescriptionsController;
  let service: jest.Mocked<PrescriptionsService>;

  const mockPrescription = {
    id: 'prescription-id',
    medications: 'Amoxicilina 250mg',
    appointmentId: 'appointment-id',
    petId: 'pet-id',
    veterinarianId: 'vet-id',
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findByAppointment: jest.fn(),
      findByPet: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    controller = new PrescriptionsController(service);
    jest.clearAllMocks();
  });

  it('delegates create with dto to PrescriptionsService', async () => {
    const dto: CreatePrescriptionDto = {
      appointmentId: 'appointment-id',
      medications: 'Amoxicilina 250mg',
    };
    service.create.mockResolvedValue(mockPrescription as never);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockPrescription);
  });

  it('delegates findByAppointment with appointmentId to PrescriptionsService', async () => {
    service.findByAppointment.mockResolvedValue([mockPrescription] as never);

    const result = await controller.findByAppointment('appointment-id');

    expect(service.findByAppointment).toHaveBeenCalledWith('appointment-id');
    expect(result).toEqual([mockPrescription]);
  });

  it('delegates findByPet with petId and pagination to PrescriptionsService', async () => {
    const paginated = {
      data: [mockPrescription],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findByPet.mockResolvedValue(paginated as never);

    const result = await controller.findByPet('pet-id', 1, 10);

    expect(service.findByPet).toHaveBeenCalledWith('pet-id', 1, 10);
    expect(result).toEqual(paginated);
  });

  it('delegates findOne with id to PrescriptionsService', async () => {
    service.findOne.mockResolvedValue(mockPrescription as never);

    const result = await controller.findOne('prescription-id');

    expect(service.findOne).toHaveBeenCalledWith('prescription-id');
    expect(result).toEqual(mockPrescription);
  });

  it('delegates update with id and dto to PrescriptionsService', async () => {
    const dto: UpdatePrescriptionDto = { instructions: 'Novas orientações' };
    const updated = { ...mockPrescription, instructions: 'Novas orientações' };
    service.update.mockResolvedValue(updated as never);

    const result = await controller.update('prescription-id', dto);

    expect(service.update).toHaveBeenCalledWith('prescription-id', dto);
    expect(result).toEqual(updated);
  });

  it('delegates remove with id to PrescriptionsService', async () => {
    const response = { message: 'Prescrição removida com sucesso.' };
    service.remove.mockResolvedValue(response);

    const result = await controller.remove('prescription-id');

    expect(service.remove).toHaveBeenCalledWith('prescription-id');
    expect(result).toEqual(response);
  });
});