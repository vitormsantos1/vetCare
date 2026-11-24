import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const prescriptionInclude = {
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
    },
  },
  pet: {
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      guardian: {
        select: {
          id: true,
          name: true,
          cpf: true,
          phone: true,
        },
      },
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
} satisfies Prisma.PrescriptionInclude;

@Injectable()
export class PrescriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    appointmentId: string;
    petId: string;
    veterinarianId: string;
    medications: string;
    instructions?: string;
    validUntil?: Date;
  }) {
    return this.prisma.prescription.create({
      data,
      include: prescriptionInclude,
    });
  }

  findAllByAppointment(appointmentId: string) {
    return this.prisma.prescription.findMany({
      where: { appointmentId },
      include: prescriptionInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllByPet(petId: string, skip: number, take: number) {
    const where: Prisma.PrescriptionWhereInput = { petId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.prescription.findMany({
        where,
        include: prescriptionInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return { items, total };
  }

  findOne(id: string) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: prescriptionInclude,
    });
  }

  update(
    id: string,
    data: {
      medications?: string;
      instructions?: string;
      validUntil?: Date;
    },
  ) {
    return this.prisma.prescription.update({
      where: { id },
      data,
      include: prescriptionInclude,
    });
  }

  remove(id: string) {
    return this.prisma.prescription.delete({
      where: { id },
    });
  }
}