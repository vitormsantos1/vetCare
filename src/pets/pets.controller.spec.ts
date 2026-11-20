import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('PetsController', () => {
  let controller: PetsController;
  let service: jest.Mocked<PetsService>;

  const mockPet = {
    id: 'pet-id',
    name: 'Rex',
    species: 'DOG',
    breed: 'Labrador',
    guardianId: 'guardian-id',
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findByGuardian: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    controller = new PetsController(service);
    jest.clearAllMocks();
  });

  it('delegates create with guardianId and dto to PetsService', async () => {
    const dto = {
      name: 'Rex',
      species: 'DOG',
      breed: 'Labrador',
    } as unknown as CreatePetDto;
    service.create.mockResolvedValue(mockPet as never);

    const result = await controller.create('guardian-id', dto);

    expect(service.create).toHaveBeenCalledWith('guardian-id', dto);
    expect(result).toEqual(mockPet);
  });

  it('delegates findByGuardian with guardianId, pagination, and search params to PetsService', async () => {
    const paginatedResponse = {
      data: [mockPet],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findByGuardian.mockResolvedValue(paginatedResponse as never);

    const result = await controller.findByGuardian(
      'guardian-id',
      1,
      10,
      'Rex',
    );

    expect(service.findByGuardian).toHaveBeenCalledWith(
      'guardian-id',
      1,
      10,
      'Rex',
    );
    expect(result).toEqual(paginatedResponse);
  });

  it('delegates findAll with pagination and search params to PetsService', async () => {
    const paginatedResponse = {
      data: [mockPet],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findAll.mockResolvedValue(paginatedResponse as never);

    const result = await controller.findAll(1, 10, 'Rex');

    expect(service.findAll).toHaveBeenCalledWith(1, 10, 'Rex');
    expect(result).toEqual(paginatedResponse);
  });

  it('delegates findOne with id to PetsService', async () => {
    service.findOne.mockResolvedValue(mockPet as never);

    const result = await controller.findOne('pet-id');

    expect(service.findOne).toHaveBeenCalledWith('pet-id');
    expect(result).toEqual(mockPet);
  });

  it('delegates update with id and dto to PetsService', async () => {
    const dto = { name: 'Max' } as UpdatePetDto;
    const updatedPet = { ...mockPet, name: 'Max' };
    service.update.mockResolvedValue(updatedPet as never);

    const result = await controller.update('pet-id', dto);

    expect(service.update).toHaveBeenCalledWith('pet-id', dto);
    expect(result).toEqual(updatedPet);
  });

  it('delegates remove with id to PetsService', async () => {
    service.remove.mockResolvedValue(mockPet as never);

    const result = await controller.remove('pet-id');

    expect(service.remove).toHaveBeenCalledWith('pet-id');
    expect(result).toEqual(mockPet);
  });
});