import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { VaccinationsController } from './vaccinations.controller';
import { VaccinationsService } from './vaccinations.service';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('VaccinationsController', () => {
  let controller: VaccinationsController;
  let service: jest.Mocked<VaccinationsService>;

  const mockVaccination = {
    id: 'vaccination-id',
    vaccineName: 'V10',
    petId: 'pet-id',
    veterinarianId: 'vet-id',
    appliedAt: new Date('2026-11-24T19:00:00.000Z'),
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findByPet: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    controller = new VaccinationsController(service);
    jest.clearAllMocks();
  });

  it('delegates create with dto to VaccinationsService', async () => {
    const dto: CreateVaccinationDto = {
      vaccineName: 'V10',
      petId: 'pet-id',
      veterinarianId: 'vet-id',
    };
    service.create.mockResolvedValue(mockVaccination as never);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockVaccination);
  });

  it('delegates findByPet with petId and pagination to VaccinationsService', async () => {
    const paginated = {
      data: [mockVaccination],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findByPet.mockResolvedValue(paginated as never);

    const result = await controller.findByPet('pet-id', 1, 10);

    expect(service.findByPet).toHaveBeenCalledWith('pet-id', 1, 10);
    expect(result).toEqual(paginated);
  });

  it('delegates findOne with id to VaccinationsService', async () => {
    service.findOne.mockResolvedValue(mockVaccination as never);

    const result = await controller.findOne('vaccination-id');

    expect(service.findOne).toHaveBeenCalledWith('vaccination-id');
    expect(result).toEqual(mockVaccination);
  });

  it('delegates update with id and dto to VaccinationsService', async () => {
    const dto: UpdateVaccinationDto = { batch: 'LOTE-2026' };
    const updated = { ...mockVaccination, batch: 'LOTE-2026' };
    service.update.mockResolvedValue(updated as never);

    const result = await controller.update('vaccination-id', dto);

    expect(service.update).toHaveBeenCalledWith('vaccination-id', dto);
    expect(result).toEqual(updated);
  });

  it('delegates remove with id to VaccinationsService', async () => {
    const response = { message: 'Registro de vacinação removido com sucesso.' };
    service.remove.mockResolvedValue(response);

    const result = await controller.remove('vaccination-id');

    expect(service.remove).toHaveBeenCalledWith('vaccination-id');
    expect(result).toEqual(response);
  });
});