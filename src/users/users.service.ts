import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UserRepository } from './users.repository';
import { AuthenticatedReq } from 'src/auth/interfaces/authenticated-request.interface';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll() {
    const users = await this.userRepository.findAll();

    return plainToInstance(ResponseUserDto, users, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: string, req: AuthenticatedReq) {
    if (req.user.role !== 'ADMIN' || req.user.id !== id) {
      throw new UnauthorizedException('Usuário não autorizado');
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    if (dto.role === Role.VET) {
      throw new BadRequestException(
        'Veterinários devem ser criados pelo módulo de veterinários.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, dto: UpdateUserDto, req: AuthenticatedReq) {
    if (req.user.role !== 'ADMIN' || req.user.id !== id) {
      throw new UnauthorizedException('Usuário não autorizado');
    }

    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (dto.role !== undefined && dto.role !== existingUser.role) {
      if (dto.role === Role.VET || existingUser.role === Role.VET) {
        throw new BadRequestException(
          'O perfil de veterinário não pode ser atribuído nem removido por aqui.',
        );
      }
    }

    if (dto.email && dto.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(dto.email);

      if (userWithEmail) {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }
    }

    const data = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.password !== undefined && {
        password: await bcrypt.hash(dto.password, 10),
      }),
    };

    const user = await this.userRepository.update(id, data);

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.userRepository.delete(id);
  }
}
