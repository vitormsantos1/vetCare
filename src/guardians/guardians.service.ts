import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { GuardiansRepository } from './guardians.repository';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { Guardian } from '@prisma/client';

@Injectable()
export class GuardiansService {
  constructor(private readonly guardiansRepository: GuardiansRepository) {}

  async create(createGuardianDto: CreateGuardianDto): Promise<Guardian> {
    const emailExists = await this.guardiansRepository.findByEmail(createGuardianDto.email);
    if (emailExists) {
      throw new ConflictException('Este email já está em uso');
    }
    return this.guardiansRepository.create(createGuardianDto);
  }

  async findAll(page: number, limit: number): Promise<Guardian[]> {
  const skip = (page - 1) * limit;
  return this.guardiansRepository.findAll(skip, limit);
  }

  async findOne(id: string): Promise<Guardian> {
    const guardian = await this.guardiansRepository.findOne(id);
    if (!guardian) {
      throw new NotFoundException('Tutor não encontrado.');
    }
    return guardian;
  }

  async update(id: string, updateGuardianDto: UpdateGuardianDto) {
    await this.findOne(id);
    return this.guardiansRepository.update(id, updateGuardianDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.guardiansRepository.remove(id);
  }
}