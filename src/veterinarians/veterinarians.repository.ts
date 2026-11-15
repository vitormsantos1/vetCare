import { Injectable } from '@nestjs/common';
import { Prisma, Role, Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';

interface CreateVeterinarianData {
  name: string;
  email: string;
  password: string;
  crmv: string;
  specialty?: string;
  phone?: string;
}

const include = {
  user: { select: { id: true, name: true, email: true, status: true } },
} satisfies Prisma.VeterinarianInclude;

@Injectable()
export class VeterinariansRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVeterinarianData) {
    const { name, email, password, crmv, specialty, phone } = data;
    return this.prisma.veterinarian.create({
      data: {
        crmv,
        specialty,
        phone,
        user: { create: { name, email, password, role: Role.VET } },
      },
      include,
    });
  }

  async findAll(skip: number, take: number, search?: string) {
    const where: Prisma.VeterinarianWhereInput = {
      user: { status: Status.ACTIVE },
      ...(search && {
        OR: [
          { crmv: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.veterinarian.findMany({
        where,
        skip,
        take,
        orderBy: { user: { name: 'asc' } },
        include,
      }),
      this.prisma.veterinarian.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.veterinarian.findFirst({
      where: { id, user: { status: Status.ACTIVE } },
      include,
    });
  }

  async update(id: string, data: UpdateVeterinarianDto) {
    return this.prisma.veterinarian.update({
      where: { id },
      data,
      include,
    });
  }

  async remove(id: string) {
    return this.prisma.veterinarian.update({
      where: { id },
      data: { user: { update: { status: Status.INACTIVE } } },
      include,
    });
  }
}
