import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Pet } from '@prisma/client';
import { GuardiansService } from '../guardians/guardians.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetsRepository } from './pets.repository';
import { PetsService } from './pets.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('PetsService', () => {
  let service: PetsService;
  let repository: jest.Mocked<PetsRepository>;
  let guardiansService: jest.Mocked<GuardiansService>;

  const mockPet = {
    id: 'pet-id',
    name: 'Rex',
    species: 'DOG',
    breed: 'Labrador',
    birthDate: new Date('2022-05-10'),
    guardianId: 'guardian-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Pet;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    guardiansService = {
      findOne: jest.fn(),
    } as never;

    service = new PetsService(repository, guardiansService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Rex',
      species: 'DOG',
      breed: 'Labrador',
      birthDate: '2022-05-10',
    } as unknown as CreatePetDto;

    it('validates guardian existence and creates a pet', async () => {
      guardiansService.findOne.mockResolvedValue({ id: 'guardian-id' } as never);
      repository.create.mockResolvedValue(mockPet);

      const result = await service.create('guardian-id', createDto);

      expect(guardiansService.findOne).toHaveBeenCalledWith('guardian-id');
      expect(repository.create).toHaveBeenCalledWith('guardian-id', createDto);
      expect(result).toEqual(mockPet);
    });

    it('throws BadRequestException when birthDate is in the future', async () => {
      const futureDate = new Date(Date.now() + 86_400_000).toISOString();
      const invalidDto = { ...createDto, birthDate: futureDate } as CreatePetDto;

      await expect(
        service.create('guardian-id', invalidDto),
      ).rejects.toEqual(
        new BadRequestException('A data de nascimento não pode ser futura.'),
      );

      expect(guardiansService.findOne).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('propagates NotFoundException when guardian does not exist', async () => {
      guardiansService.findOne.mockRejectedValue(
        new NotFoundException('Tutor não encontrado.'),
      );

      await expect(
        service.create('missing-guardian-id', createDto),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated pets and trims the search filter', async () => {
      repository.findAll.mockResolvedValue({
        items: [mockPet],
        total: 15,
      });

      const result = await service.findAll(2, 10, '  Rex  ');

      expect(repository.findAll).toHaveBeenCalledWith(
        10,
        10,
        undefined,
        'Rex',
      );
      expect(result).toEqual({
        data: [mockPet],
        meta: {
          total: 15,
          page: 2,
          limit: 10,
          totalPages: 2,
        },
      });
    });

    it('clamps page below 1 and limit outside [1, 100]', async () => {
      repository.findAll.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await service.findAll(-1, 250);

      expect(repository.findAll).toHaveBeenCalledWith(
        0,
        100,
        undefined,
        undefined,
      );
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });
    });
  });

  describe('findByGuardian', () => {
    it('validates guardian existence and returns paginated pets for that guardian', async () => {
      guardiansService.findOne.mockResolvedValue({ id: 'guardian-id' } as never);
      repository.findAll.mockResolvedValue({
        items: [mockPet],
        total: 1,
      });

      const result = await service.findByGuardian(
        'guardian-id',
        1,
        10,
        '  Rex  ',
      );

      expect(guardiansService.findOne).toHaveBeenCalledWith('guardian-id');
      expect(repository.findAll).toHaveBeenCalledWith(
        0,
        10,
        'guardian-id',
        'Rex',
      );
      expect(result).toEqual({
        data: [mockPet],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('propagates NotFoundException without querying pets when guardian does not exist', async () => {
      guardiansService.findOne.mockRejectedValue(
        new NotFoundException('Tutor não encontrado.'),
      );

      await expect(
        service.findByGuardian('missing-guardian-id', 1, 10),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the pet when found', async () => {
      repository.findOne.mockResolvedValue(mockPet);

      const result = await service.findOne('pet-id');

      expect(repository.findOne).toHaveBeenCalledWith('pet-id');
      expect(result).toEqual(mockPet);
    });

    it('throws NotFoundException when pet does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toEqual(
        new NotFoundException('Pet não encontrado.'),
      );
    });
  });

  describe('update', () => {
    it('validates pet existence and updates the pet', async () => {
      const dto = { name: 'Max' } as UpdatePetDto;
      const updatedPet = { ...mockPet, name: 'Max' };
      repository.findOne.mockResolvedValue(mockPet);
      repository.update.mockResolvedValue(updatedPet);

      const result = await service.update('pet-id', dto);

      expect(repository.findOne).toHaveBeenCalledWith('pet-id');
      expect(repository.update).toHaveBeenCalledWith('pet-id', dto);
      expect(result).toEqual(updatedPet);
    });

    it('throws NotFoundException without updating when pet does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { name: 'Max' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException without updating when birthDate is in the future', async () => {
      const futureDate = new Date(Date.now() + 86_400_000).toISOString();
      repository.findOne.mockResolvedValue(mockPet);

      await expect(
        service.update('pet-id', { birthDate: futureDate } as UpdatePetDto),
      ).rejects.toEqual(
        new BadRequestException('A data de nascimento não pode ser futura.'),
      );

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('validates pet existence and removes the pet', async () => {
      repository.findOne.mockResolvedValue(mockPet);
      repository.remove.mockResolvedValue(mockPet);

      const result = await service.remove('pet-id');

      expect(repository.findOne).toHaveBeenCalledWith('pet-id');
      expect(repository.remove).toHaveBeenCalledWith('pet-id');
      expect(result).toEqual(mockPet);
    });

    it('throws NotFoundException without removing when pet does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});