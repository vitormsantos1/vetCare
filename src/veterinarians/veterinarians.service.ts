import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // use a mesma lib e o mesmo custo do módulo users
import { VeterinariansRepository } from './veterinarians.repository';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';

const MAX_LIMIT = 100;

@Injectable()
export class VeterinariansService {
  constructor(
    private readonly veterinariansRepository: VeterinariansRepository,
  ) {}

  async create(dto: CreateVeterinarianDto) {
    const password = await bcrypt.hash(dto.password, 10);
    try {
      return await this.veterinariansRepository.create({
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        password,
        crmv: this.normalizeCrmv(dto.crmv),
        specialty: dto.specialty,
        phone: dto.phone,
      });
    } catch (error) {
      this.rethrow(error);
    }
  }

  async findAll(page: number, limit: number, search?: string) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    const { items, total } = await this.veterinariansRepository.findAll(
      (safePage - 1) * safeLimit,
      safeLimit,
      search?.trim(),
    );

    return {
      data: items,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: string) {
    const veterinarian = await this.veterinariansRepository.findOne(id);
    if (!veterinarian) {
      throw new NotFoundException('Veterinário não encontrado.');
    }
    return veterinarian;
  }

  async update(id: string, dto: UpdateVeterinarianDto) {
    await this.findOne(id);
    try {
      return await this.veterinariansRepository.update(id, {
        ...dto,
        ...(dto.crmv && { crmv: this.normalizeCrmv(dto.crmv) }),
      });
    } catch (error) {
      this.rethrow(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.veterinariansRepository.remove(id);
  }

  private normalizeCrmv(crmv: string): string {
    return crmv.trim().toUpperCase();
  }

  private rethrow(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = String(error.meta?.target ?? '');
      if (target.includes('crmv')) {
        throw new ConflictException('Já existe um veterinário com este CRMV.');
      }
      if (target.includes('email')) {
        throw new ConflictException('Este e-mail já está em uso.');
      }
      throw new ConflictException('Registro duplicado.');
    }
    throw error;
  }
}
