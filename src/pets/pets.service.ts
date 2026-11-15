import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Pet } from '@prisma/client';
import { PetsRepository } from './pets.repository';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { GuardiansService } from '../guardians/guardians.service';

const MAX_LIMIT = 100;

@Injectable()
export class PetsService {
  constructor(
    private readonly petsRepository: PetsRepository,
    private readonly guardiansService: GuardiansService,
  ) {}

  async create(guardianId: string, dto: CreatePetDto): Promise<Pet> {
    this.assertBirthDate(dto.birthDate);
    await this.guardiansService.findOne(guardianId);
    return this.petsRepository.create(guardianId, dto);
  }

  async findAll(page: number, limit: number, search?: string) {
    return this.list(page, limit, search);
  }

  async findByGuardian(
    guardianId: string,
    page: number,
    limit: number,
    search?: string,
  ) {
    await this.guardiansService.findOne(guardianId);
    return this.list(page, limit, search, guardianId);
  }

  async findOne(id: string): Promise<Pet> {
    const pet = await this.petsRepository.findOne(id);
    if (!pet) throw new NotFoundException('Pet não encontrado.');
    return pet;
  }

  async update(id: string, dto: UpdatePetDto): Promise<Pet> {
    await this.findOne(id);
    this.assertBirthDate(dto.birthDate);
    return this.petsRepository.update(id, dto);
  }

  async remove(id: string): Promise<Pet> {
    await this.findOne(id);
    return this.petsRepository.remove(id);
  }

  private async list(
    page: number,
    limit: number,
    search?: string,
    guardianId?: string,
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    const { items, total } = await this.petsRepository.findAll(
      (safePage - 1) * safeLimit,
      safeLimit,
      guardianId,
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

  private assertBirthDate(birthDate?: string) {
    if (birthDate && new Date(birthDate) > new Date()) {
      throw new BadRequestException(
        'A data de nascimento não pode ser futura.',
      );
    }
  }
}
