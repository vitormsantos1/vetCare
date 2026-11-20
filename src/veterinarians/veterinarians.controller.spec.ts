import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { VeterinariansController } from './veterinarians.controller';
import { VeterinariansService } from './veterinarians.service';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('VeterinariansController', () => {
  let controller: VeterinariansController;
  let service: jest.Mocked<VeterinariansService>;

  const mockVeterinarian = {
    id: 'vet-id',
    name: 'Dr. Carlos Lima',
    email: 'carlos@vetcare.com',
    crmv: 'CRMV-BA 1234',
    specialty: 'Clínica Geral',
    phone: '71999999999',
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    controller = new VeterinariansController(service);
    jest.clearAllMocks();
  });

  it('delegates create with dto to VeterinariansService', async () => {
    const dto: CreateVeterinarianDto = {
      name: 'Dr. Carlos Lima',
      email: 'carlos@vetcare.com',
      password: 'plain-password',
      crmv: 'CRMV-BA 1234',
      specialty: 'Clínica Geral',
      phone: '71999999999',
    };
    service.create.mockResolvedValue(mockVeterinarian as never);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockVeterinarian);
  });

  it('delegates findAll with pagination and search params to VeterinariansService', async () => {
    const paginatedResponse = {
      data: [mockVeterinarian],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findAll.mockResolvedValue(paginatedResponse as never);

    const result = await controller.findAll(1, 10, 'Carlos');

    expect(service.findAll).toHaveBeenCalledWith(1, 10, 'Carlos');
    expect(result).toEqual(paginatedResponse);
  });

  it('delegates findOne with id to VeterinariansService', async () => {
    service.findOne.mockResolvedValue(mockVeterinarian as never);

    const result = await controller.findOne('vet-id');

    expect(service.findOne).toHaveBeenCalledWith('vet-id');
    expect(result).toEqual(mockVeterinarian);
  });

  it('delegates update with id and dto to VeterinariansService', async () => {
    const dto: UpdateVeterinarianDto = { specialty: 'Cirurgia' };
    const updated = { ...mockVeterinarian, specialty: 'Cirurgia' };
    service.update.mockResolvedValue(updated as never);

    const result = await controller.update('vet-id', dto);

    expect(service.update).toHaveBeenCalledWith('vet-id', dto);
    expect(result).toEqual(updated);
  });

  it('delegates remove with id to VeterinariansService', async () => {
    service.remove.mockResolvedValue(mockVeterinarian as never);

    const result = await controller.remove('vet-id');

    expect(service.remove).toHaveBeenCalledWith('vet-id');
    expect(result).toEqual(mockVeterinarian);
  });
});