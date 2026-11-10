import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Guardian, Prisma } from '@prisma/client';
import { GuardiansRepository } from './guardians.repository';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

const MAX_LIMIT = 100;

@Injectable()
export class GuardiansService {
  constructor(private readonly guardiansRepository: GuardiansRepository) {}

  async create(dto: CreateGuardianDto): Promise<Guardian> {
    try {
      return await this.guardiansRepository.create(this.normalize(dto));
    } catch (error) {
      this.rethrow(error);
    }
  }

  async findAll(page: number, limit: number, search?: string) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    const { items, total } = await this.guardiansRepository.findAll(
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

  async findOne(id: string): Promise<Guardian> {
    const guardian = await this.guardiansRepository.findOne(id);
    if (!guardian) {
      throw new NotFoundException('Tutor não encontrado.');
    }
    return guardian;
  }

  async update(id: string, dto: UpdateGuardianDto): Promise<Guardian> {
    await this.findOne(id);
    try {
      return await this.guardiansRepository.update(id, this.normalize(dto));
    } catch (error) {
      this.rethrow(error);
    }
  }

  async remove(id: string): Promise<Guardian> {
    await this.findOne(id);
    return this.guardiansRepository.remove(id);
  }

  private normalize<T extends { cpf?: string }>(dto: T): T {
    return dto.cpf ? { ...dto, cpf: dto.cpf.replace(/\D/g, '') } : dto;
  }

  private rethrow(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Já existe um tutor com este CPF');
    }
    throw error;
  }
}
