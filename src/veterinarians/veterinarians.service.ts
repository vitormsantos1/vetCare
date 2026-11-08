import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { VeterinariansRepository } from './veterinarians.repository';
import { Veterinarian } from '@prisma/client';

@Injectable()
export class VeterinariansService {
  constructor(private readonly veterinariansRepository: VeterinariansRepository) {}

  async create(createDto: CreateVeterinarianDto): Promise<Veterinarian> {
    const exists = await this.veterinariansRepository.findByCrmvOrUserId(createDto.crmv, createDto.userId);
    
    if (exists) {
      if (exists.crmv === createDto.crmv) {
        throw new ConflictException('Já existe um veterinário cadastrado com este CRMV.');
      }
      if (exists.userId === createDto.userId) {
        throw new ConflictException('Este usuário já possui um perfil de veterinário vinculado.');
      }
    }
    return this.veterinariansRepository.create(createDto);
  }

  async findAll(): Promise<Veterinarian[]> {
    return this.veterinariansRepository.findAll();
  }

  async findOne(id: string): Promise<Veterinarian> {
    const veterinarian = await this.veterinariansRepository.findOne(id);
    
    if (!veterinarian) {
      throw new NotFoundException(`Veterinário com ID ${id} não encontrado.`);
    }
    return veterinarian;
  }

  async update(id: string, updateDto: UpdateVeterinarianDto): Promise<Veterinarian> {
    await this.findOne(id);
    
    if (updateDto.crmv) {
      const crmvExists = await this.veterinariansRepository.findByCrmv(updateDto.crmv);
      
      if (crmvExists && crmvExists.id !== id) {
        throw new ConflictException('Este CRMV já está em uso por outro veterinário.');
      }
    }

    return this.veterinariansRepository.update(id, updateDto);
  }

  async remove(id: string): Promise<Veterinarian> {
    await this.findOne(id);
    return this.veterinariansRepository.remove(id);
  }
}