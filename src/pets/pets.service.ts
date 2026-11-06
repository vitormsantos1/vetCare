import { Injectable, NotFoundException } from '@nestjs/common';
import { PetsRepository } from './pets.repository';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { GuardiansRepository } from '../guardians/guardians.repository';
import { Pet } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(
    private readonly petsRepository: PetsRepository,
    private readonly guardiansRepository: GuardiansRepository,
  ) {}

  async create(createPetDto: CreatePetDto): Promise<Pet> {
    const guardianExists = await this.guardiansRepository.findOne(createPetDto.guardianId);
    if (!guardianExists) {
      throw new NotFoundException('Tutor não encontrado.');
    }
    return this.petsRepository.create(createPetDto);
  }

  async findAll() {
    return this.petsRepository.findAll();
  }

  async findOne(id: string): Promise<Pet> {
    const pet = await this.petsRepository.findOne(id);
    if (!pet) throw new NotFoundException('Pet não encontrado.');
    return pet;
  }

  async update(id: string, updatePetDto: UpdatePetDto) {
    await this.findOne(id);
    return this.petsRepository.update(id, updatePetDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.petsRepository.remove(id);
  }
}