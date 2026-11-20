import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, Status, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthenticatedReq } from 'src/auth/interfaces/authenticated-request.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { UserService } from './users.service';

/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unnecessary-type-assertion */

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  const baseUser: User = {
    id: 'user-id',
    name: 'Maria Silva',
    email: 'maria@vetcare.com',
    password: 'hashed-password',
    status: Status.ACTIVE,
    role: Role.RECEPTIONIST,
    createdAt: new Date(),
    updatedAt: new Date(),
    passwordResetTokenHash: null,
    passwordResetTokenExpiresAt: null,
  };

  const makeReq = (role: Role, id = 'requester-id'): AuthenticatedReq =>
    ({ user: { id, role } }) as AuthenticatedReq;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as never;

    service = new UserService(repository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all users mapped to ResponseUserDto without sensitive fields', async () => {
      repository.findAll.mockResolvedValue([baseUser]);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ResponseUserDto);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('allows an ADMIN to fetch any user by id', async () => {
      repository.findById.mockResolvedValue(baseUser);

      const result = await service.findOne(baseUser.id, makeReq(Role.ADMIN));

      expect(repository.findById).toHaveBeenCalledWith(baseUser.id);
      expect(result).toBeInstanceOf(ResponseUserDto);
      expect(result.id).toBe(baseUser.id);
    });

    it('allows a non-admin user to fetch their own profile', async () => {
      repository.findById.mockResolvedValue(baseUser);

      const result = await service.findOne(
        baseUser.id,
        makeReq(Role.RECEPTIONIST, baseUser.id),
      );

      expect(repository.findById).toHaveBeenCalledWith(baseUser.id);
      expect(result.email).toBe(baseUser.email);
    });

    it('rejects when a non-admin user tries to access another user', async () => {
      await expect(
        service.findOne(baseUser.id, makeReq(Role.RECEPTIONIST, 'other-id')),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findOne('missing-id', makeReq(Role.ADMIN)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      name: 'Carlos Souza',
      email: 'carlos@vetcare.com',
      password: 'plain-password',
      role: Role.RECEPTIONIST,
    };

    it('hashes the password, creates the user, and returns a ResponseUserDto', async () => {
      repository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('encrypted-password');
      repository.create.mockResolvedValue({
        ...baseUser,
        name: createDto.name,
        email: createDto.email,
        password: 'encrypted-password',
      });

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(repository.create).toHaveBeenCalledWith({
        name: createDto.name,
        email: createDto.email,
        password: 'encrypted-password',
        role: Role.RECEPTIONIST,
      });
      expect(result).toBeInstanceOf(ResponseUserDto);
      expect(result).not.toHaveProperty('password');
    });

    it('throws ConflictException when email is already in use', async () => {
      repository.findByEmail.mockResolvedValue(baseUser);

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when trying to create a user with VET role', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, role: Role.VET }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('allows an ADMIN to update another user and hashes a new password', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Maria Atualizada',
        password: 'new-password',
      };
      repository.findById.mockResolvedValue(baseUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      repository.update.mockResolvedValue({
        ...baseUser,
        name: updateDto.name!,
        password: 'new-hashed-password',
      });

      const result = await service.update(
        baseUser.id,
        updateDto,
        makeReq(Role.ADMIN),
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(repository.update).toHaveBeenCalledWith(baseUser.id, {
        name: 'Maria Atualizada',
        password: 'new-hashed-password',
      });
      expect(result).toBeInstanceOf(ResponseUserDto);
    });

    it('allows a user to update their own data without re-hashing when password is omitted', async () => {
      const updateDto: UpdateUserDto = { name: 'Novo Nome' };
      repository.findById.mockResolvedValue(baseUser);
      repository.update.mockResolvedValue({
        ...baseUser,
        name: 'Novo Nome',
      });

      await service.update(
        baseUser.id,
        updateDto,
        makeReq(Role.RECEPTIONIST, baseUser.id),
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(baseUser.id, {
        name: 'Novo Nome',
      });
    });

    it('rejects when a non-admin user tries to update another user', async () => {
      await expect(
        service.update(
          baseUser.id,
          { name: 'Hack' },
          makeReq(Role.RECEPTIONIST, 'other-id'),
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { name: 'Teste' }, makeReq(Role.ADMIN)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it.each([
      {
        existingRole: Role.RECEPTIONIST,
        newRole: Role.VET,
      },
      {
        existingRole: Role.VET,
        newRole: Role.RECEPTIONIST,
      },
    ])(
      'rejects changing role between $existingRole and $newRole',
      async ({ existingRole, newRole }) => {
        repository.findById.mockResolvedValue({
          ...baseUser,
          role: existingRole,
        });

        await expect(
          service.update(
            baseUser.id,
            { role: newRole } as UpdateUserDto,
            makeReq(Role.ADMIN),
          ),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(repository.update).not.toHaveBeenCalled();
      },
    );

    it('throws ConflictException when updating to an email already registered', async () => {
      repository.findById.mockResolvedValue(baseUser);
      repository.findByEmail.mockResolvedValue({
        ...baseUser,
        id: 'another-user-id',
        email: 'duplicado@vetcare.com',
      });

      await expect(
        service.update(
          baseUser.id,
          { email: 'duplicado@vetcare.com' },
          makeReq(Role.ADMIN),
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the user when found', async () => {
      repository.findById.mockResolvedValue(baseUser);
      repository.delete.mockResolvedValue(undefined as never);

      await expect(service.remove(baseUser.id)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(baseUser.id);
    });

    it('throws NotFoundException when user to delete does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});