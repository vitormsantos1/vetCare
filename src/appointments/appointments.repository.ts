import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export interface FindAppointmentsFilters {
  skip: number;
  take: number;
  startDate?: Date;
  endDate?: Date;
  veterinarianId?: string;
  status?: AppointmentStatus;
}

const appointmentInclude = {
  pet: {
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
    },
  },
  guardian: {
    select: {
      id: true,
      name: true,
      phone: true,
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
} satisfies Prisma.AppointmentInclude;

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    scheduledAt: Date;
    petId: string;
    guardianId: string;
    veterinarianId: string;
    reason?: string;
  }) {
    return this.prisma.appointment.create({
      data,
      include: appointmentInclude,
    });
  }

  findConflictingAppointment(veterinarianId: string, scheduledAt: Date) {
    return this.prisma.appointment.findFirst({
      where: {
        veterinarianId,
        scheduledAt,
        status: AppointmentStatus.SCHEDULED,
      },
    });
  }

  async findAll(filters: FindAppointmentsFilters) {
    const where: Prisma.AppointmentWhereInput = {
      ...(filters.veterinarianId && { veterinarianId: filters.veterinarianId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate &&
        filters.endDate && {
          scheduledAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: { scheduledAt: 'asc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { items, total };
  }

  findOne(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        ...appointmentInclude,
        medicalRecord: true,
      },
    });
  }

  cancel(id: string, cancellationReason?: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELED,
        canceledAt: new Date(),
        ...(cancellationReason !== undefined && { cancellationReason }),
      },
      include: appointmentInclude,
    });
  }
}