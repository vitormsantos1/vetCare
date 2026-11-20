import { AppointmentStatus } from '@prisma/client';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: jest.Mocked<AppointmentsService>;

  const mockAppointment = {
    id: 'appointment-id',
    scheduledAt: new Date('2026-11-25T14:30:00.000Z'),
    status: AppointmentStatus.SCHEDULED,
    petId: 'pet-id',
    guardianId: 'guardian-id',
    veterinarianId: 'vet-id',
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
    } as never;

    controller = new AppointmentsController(service);
    jest.clearAllMocks();
  });

  it('delegates create with dto to AppointmentsService', async () => {
    const dto: CreateAppointmentDto = {
      scheduledAt: '2026-11-25T14:30:00.000Z',
      petId: 'pet-id',
      guardianId: 'guardian-id',
      veterinarianId: 'vet-id',
      reason: 'Consulta de rotina',
    };
    service.create.mockResolvedValue(mockAppointment as never);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockAppointment);
  });

  it('delegates findAll with schedule filters to AppointmentsService', async () => {
    const paginated = {
      data: [mockAppointment],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service.findAll.mockResolvedValue(paginated as never);

    const result = await controller.findAll(
      1,
      10,
      '2026-11-25',
      undefined,
      'vet-id',
      AppointmentStatus.SCHEDULED,
    );

    expect(service.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      date: '2026-11-25',
      weekStart: undefined,
      veterinarianId: 'vet-id',
      status: AppointmentStatus.SCHEDULED,
    });
    expect(result).toEqual(paginated);
  });

  it('delegates findOne with id to AppointmentsService', async () => {
    service.findOne.mockResolvedValue(mockAppointment as never);

    const result = await controller.findOne('appointment-id');

    expect(service.findOne).toHaveBeenCalledWith('appointment-id');
    expect(result).toEqual(mockAppointment);
  });

  it('delegates cancel with id and dto to AppointmentsService', async () => {
    const dto: CancelAppointmentDto = { cancellationReason: 'Imprevisto' };
    const canceled = {
      ...mockAppointment,
      status: AppointmentStatus.CANCELED,
    };
    service.cancel.mockResolvedValue(canceled as never);

    const result = await controller.cancel('appointment-id', dto);

    expect(service.cancel).toHaveBeenCalledWith('appointment-id', dto);
    expect(result).toEqual(canceled);
  });
});