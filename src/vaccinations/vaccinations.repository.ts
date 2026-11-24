import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const vaccinationInclude = {
  pet: {
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
    },
  },
  veterinarian: {
    select: {
      id: true,
      crmv: true,
      specialty: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
    },
  },
} satisfies Prisma.VaccinationInclude;

@Injectable()
export class VaccinationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    vaccineName: string;
    petId: string;
    veterinarianId: string;
    appointmentId?: string;
    batch?: string;
    appliedAt: Date;
    nextDoseAt?: Date;
    notes?: string;
  }) {
    return this.prisma.vaccination.create({
      data,
      include: vaccinationInclude,
    });
  }

  async findAllByPet(petId: string, skip: number, take: number) {
    const where: Prisma.VaccinationWhereInput = { petId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vaccination.findMany({
        where,
        include: vaccinationInclude,
        orderBy: { appliedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.vaccination.count({ where }),
    ]);

    return { items, total };
  }

  findOne(id: string) {
    return this.prisma.vaccination.findUnique({
      where: { id },
      include: vaccinationInclude,
    });
  }

  update(
    id: string,
    data: {
      vaccineName?: string;
      batch?: string;
      appliedAt?: Date;
      nextDoseAt?: Date;
      notes?: string;
    },
  ) {
    return this.prisma.vaccination.update({
      where: { id },
      data,
      include: vaccinationInclude,
    });
  }

  remove(id: string) {
    return this.prisma.vaccination.delete({
      where: { id },
    });
  }
}