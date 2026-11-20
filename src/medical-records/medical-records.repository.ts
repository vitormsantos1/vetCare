import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const medicalRecordInclude = {
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      reason: true,
    },
  },
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
} satisfies Prisma.MedicalRecordInclude;

@Injectable()
export class MedicalRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAppointmentId(appointmentId: string) {
    return this.prisma.medicalRecord.findUnique({
      where: { appointmentId },
    });
  }

  async createAndCompleteAppointment(data: {
    appointmentId: string;
    petId: string;
    veterinarianId: string;
    diagnosis: string;
    observations?: string;
    procedures?: string;
    prescriptions?: string;
  }) {
    const [medicalRecord] = await this.prisma.$transaction([
      this.prisma.medicalRecord.create({
        data,
        include: medicalRecordInclude,
      }),
      this.prisma.appointment.update({
        where: { id: data.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      }),
    ]);

    return medicalRecord;
  }

  async findAllByPet(petId: string, skip: number, take: number) {
    const where: Prisma.MedicalRecordWhereInput = { petId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.medicalRecord.findMany({
        where,
        include: medicalRecordInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.medicalRecord.count({ where }),
    ]);

    return { items, total };
  }

  findOne(id: string) {
    return this.prisma.medicalRecord.findUnique({
      where: { id },
      include: medicalRecordInclude,
    });
  }

  update(
    id: string,
    data: {
      diagnosis?: string;
      observations?: string;
      procedures?: string;
      prescriptions?: string;
    },
  ) {
    return this.prisma.medicalRecord.update({
      where: { id },
      data,
      include: medicalRecordInclude,
    });
  }
}