import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('MedicalRecordsController', () => {
  let controller: MedicalRecordsController;
  let service: jest.Mocked<MedicalRecordsService>;

  const mockRecord = {
    id: 'record-id',
    diagnosis: 'Otite externa',
    appointmentId: 'appointment-id',
    petId: 'pet-id',
    veterinarianId: 'vet-id',
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findByPet: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as never;

    controller = new MedicalRecordsController(service);
    jest.clearAllMocks();
  });

  it('delegates create with dto to MedicalRecordsService', async () => {
    const dto: CreateMedicalRecordDto = {
      appointmentId: 'appointment-id',
      diagnosis: 'Otite externa',
    };
    service.create.mockResolvedValue(mockRecord as never);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockRecord);
  });

  it('delegates findByPet with petId and pagination to MedicalRecordsService', async () => {
    const paginated = {
      data: [mockRecord],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findByPet.mockResolvedValue(paginated as never);

    const result = await controller.findByPet('pet-id', 1, 10);

    expect(service.findByPet).toHaveBeenCalledWith('pet-id', 1, 10);
    expect(result).toEqual(paginated);
  });

  it('delegates findOne with id to MedicalRecordsService', async () => {
    service.findOne.mockResolvedValue(mockRecord as never);

    const result = await controller.findOne('record-id');

    expect(service.findOne).toHaveBeenCalledWith('record-id');
    expect(result).toEqual(mockRecord);
  });

  it('delegates update with id and dto to MedicalRecordsService', async () => {
    const dto: UpdateMedicalRecordDto = { prescriptions: 'Nova prescrição' };
    const updated = { ...mockRecord, prescriptions: 'Nova prescrição' };
    service.update.mockResolvedValue(updated as never);

    const result = await controller.update('record-id', dto);

    expect(service.update).toHaveBeenCalledWith('record-id', dto);
    expect(result).toEqual(updated);
  });
});