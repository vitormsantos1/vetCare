import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { VeterinariansRepository } from './veterinarians.repository';
import { VeterinariansService } from './veterinarians.service';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('VeterinariansService', () => {
  let service: VeterinariansService;
  let repository: jest.Mocked<VeterinariansRepository>;

  const mockVeterinarian = {
    id: 'vet-id',
    name: 'Dr. Carlos Lima',
    email: 'carlos@vetcare.com',
    crmv: 'CRMV-BA 1234',
    specialty: 'Clínica Geral',
    phone: '71999999999',
    userId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const makePrismaUniqueError = (target?: string[]) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      ...(target && { meta: { target } }),
    });

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    service = new VeterinariansService(repository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateVeterinarianDto = {
      name: '  Dr. Carlos Lima  ',
      email: '  CARLOS@VetCare.com  ',
      password: 'plain-password',
      crmv: '  crmv-ba 1234  ',
      specialty: 'Clínica Geral',
      phone: '71999999999',
    };

    it('hashes the password, normalizes fields, and creates a veterinarian', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.create.mockResolvedValue(mockVeterinarian as never);

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Dr. Carlos Lima',
        email: 'carlos@vetcare.com',
        password: 'hashed-password',
        crmv: 'CRMV-BA 1234',
        specialty: 'Clínica Geral',
        phone: '71999999999',
      });
      expect(result).toEqual(mockVeterinarian);
    });

    it.each([
      {
        target: ['crmv'],
        expectedMessage: 'Já existe um veterinário com este CRMV.',
      },
      {
        target: ['email'],
        expectedMessage: 'Este e-mail já está em uso.',
      },
      {
        target: ['unknown_field'],
        expectedMessage: 'Registro duplicado.',
      },
    ])(
      'throws ConflictException ($expectedMessage) on P2002 error for $target',
      async ({ target, expectedMessage }) => {
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        repository.create.mockRejectedValue(makePrismaUniqueError(target));

        await expect(service.create(createDto)).rejects.toEqual(
          new ConflictException(expectedMessage),
        );
      },
    );

    it('rethrows unexpected repository errors', async () => {
      const unexpectedError = new Error('Database connection lost');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.create.mockRejectedValue(unexpectedError);

      await expect(service.create(createDto)).rejects.toThrow(unexpectedError);
    });
  });

  describe('findAll', () => {
    it('returns paginated veterinarians and trims the search filter', async () => {
      repository.findAll.mockResolvedValue({
        items: [mockVeterinarian] as never,
        total: 25,
      });

      const result = await service.findAll(2, 10, '  Carlos  ');

      expect(repository.findAll).toHaveBeenCalledWith(10, 10, 'Carlos');
      expect(result).toEqual({
        data: [mockVeterinarian],
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      });
    });

    it('clamps page below 1 and limit outside [1, 100]', async () => {
      repository.findAll.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await service.findAll(0, 500);

      expect(repository.findAll).toHaveBeenCalledWith(0, 100, undefined);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });
    });
  });

  describe('findOne', () => {
    it('returns the veterinarian when found', async () => {
      repository.findOne.mockResolvedValue(mockVeterinarian as never);

      const result = await service.findOne('vet-id');

      expect(repository.findOne).toHaveBeenCalledWith('vet-id');
      expect(result).toEqual(mockVeterinarian);
    });

    it('throws NotFoundException when veterinarian does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('validates existence, normalizes crmv when provided, and updates', async () => {
      const dto: UpdateVeterinarianDto = {
        specialty: 'Cirurgia',
        crmv: '  crmv-sp 9876 ',
      };
      const updatedVet = {
        ...mockVeterinarian,
        specialty: 'Cirurgia',
        crmv: 'CRMV-SP 9876',
      };
      repository.findOne.mockResolvedValue(mockVeterinarian as never);
      repository.update.mockResolvedValue(updatedVet as never);

      const result = await service.update('vet-id', dto);

      expect(repository.findOne).toHaveBeenCalledWith('vet-id');
      expect(repository.update).toHaveBeenCalledWith('vet-id', {
        specialty: 'Cirurgia',
        crmv: 'CRMV-SP 9876',
      });
      expect(result).toEqual(updatedVet);
    });

    it('throws NotFoundException without calling update when veterinarian does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { specialty: 'Dermatologia' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when updating to a duplicate CRMV', async () => {
      repository.findOne.mockResolvedValue(mockVeterinarian as never);
      repository.update.mockRejectedValue(makePrismaUniqueError(['crmv']));

      await expect(
        service.update('vet-id', { crmv: 'CRMV-BA 9999' }),
      ).rejects.toEqual(
        new ConflictException('Já existe um veterinário com este CRMV.'),
      );
    });
  });

  describe('remove', () => {
    it('validates existence and removes the veterinarian', async () => {
      repository.findOne.mockResolvedValue(mockVeterinarian as never);
      repository.remove.mockResolvedValue(mockVeterinarian as never);

      const result = await service.remove('vet-id');

      expect(repository.findOne).toHaveBeenCalledWith('vet-id');
      expect(repository.remove).toHaveBeenCalledWith('vet-id');
      expect(result).toEqual(mockVeterinarian);
    });

    it('throws NotFoundException without calling remove when veterinarian does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});