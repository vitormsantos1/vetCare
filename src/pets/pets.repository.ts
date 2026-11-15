import { Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsRepository {
  constructor(private prisma: PrismaService) {}

  async create(guardianId: string, data: CreatePetDto) {
    const { birthDate, ...rest } = data;
    return this.prisma.pet.create({
      data: {
        ...rest,
        guardianId,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
    });
  }

  async findAll(
    skip: number,
    take: number,
    guardianId?: string,
    search?: string,
  ) {
    const where: Prisma.PetWhereInput = {
      status: Status.ACTIVE,
      ...(guardianId && { guardianId }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.pet.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.pet.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.pet.findFirst({
      where: { id, status: Status.ACTIVE },
    });
  }

  async update(id: string, data: UpdatePetDto) {
    const { birthDate, ...rest } = data;
    return this.prisma.pet.update({
      where: { id },
      data: {
        ...rest,
        ...(birthDate && { birthDate: new Date(birthDate) }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.pet.update({
      where: { id },
      data: { status: Status.INACTIVE },
    });
  }
}
