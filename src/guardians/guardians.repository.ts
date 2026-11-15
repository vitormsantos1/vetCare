import { Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateGuardianDto) {
    return this.prisma.guardian.create({ data });
  }

  async findAll(skip: number, take: number, search?: string) {
    const where: Prisma.GuardianWhereInput = {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.guardian.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.guardian.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.guardian.findFirst({
      where: { id },
    });
  }

  async update(id: string, data: UpdateGuardianDto) {
    return this.prisma.guardian.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.guardian.update({
      where: { id },
      data: { status: Status.INACTIVE },
    });
  }
}
