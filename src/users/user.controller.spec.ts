import { Role } from '@prisma/client';
import { AuthenticatedReq } from 'src/auth/interfaces/authenticated-request.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserController } from './users.controller';
import { UserService } from './users.service';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  const mockUserResponse = {
    id: 'user-id',
    name: 'Maria Silva',
    email: 'maria@vetcare.com',
    role: Role.RECEPTIONIST,
  } as ResponseUserDto;

  const mockReq = {
    user: { id: 'admin-id', role: Role.ADMIN },
  } as AuthenticatedReq;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    controller = new UserController(service);
    jest.clearAllMocks();
  });

  it('delegates findAll to UserService', async () => {
    service.findAll.mockResolvedValue([mockUserResponse]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([mockUserResponse]);
  });

  it('delegates findOne with id and request context to UserService', async () => {
    service.findOne.mockResolvedValue(mockUserResponse);

    const result = await controller.findOne('user-id', mockReq);

    expect(service.findOne).toHaveBeenCalledWith('user-id', mockReq);
    expect(result).toEqual(mockUserResponse);
  });

  it('delegates create with dto to UserService', async () => {
    const dto: CreateUserDto = {
      name: 'Maria Silva',
      email: 'maria@vetcare.com',
      password: 'plain-password',
      role: Role.RECEPTIONIST,
    };
    service.create.mockResolvedValue(mockUserResponse);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockUserResponse);
  });

  it('delegates update with id, dto, and request context to UserService', async () => {
    const dto: UpdateUserDto = { name: 'Maria Atualizada' };
    const updatedResponse = {
      ...mockUserResponse,
      name: 'Maria Atualizada',
    } as ResponseUserDto;
    service.update.mockResolvedValue(updatedResponse);

    const result = await controller.update('user-id', dto, mockReq);

    expect(service.update).toHaveBeenCalledWith('user-id', dto, mockReq);
    expect(result).toEqual(updatedResponse);
  });

  it('delegates remove with id to UserService and returns void', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove('user-id')).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith('user-id');
  });
});