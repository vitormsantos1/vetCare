import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        ...data,
        birthDate: new Date(data.birthDate),
      },
    });
  }

  async findAll() {
    return this.prisma.pet.findMany({ include: { guardian: true } });
  }

  async findOne(id: string) {
    return this.prisma.pet.findUnique({
      where: { id },
      include: { guardian: true },
    });
  }

  async update(id: string, data: UpdatePetDto) {
    const updateData = { ...data };
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate) as any;
    }

    return this.prisma.pet.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.pet.delete({ where: { id } });
  }
}