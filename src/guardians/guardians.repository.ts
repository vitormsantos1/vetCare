import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateGuardianDto) {
    return this.prisma.guardian.create({ data });
  }

  async findAll(skip: number, take: number) {
    return this.prisma.guardian.findMany({
      skip,
      take,
      include: { pets: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.guardian.findUnique({
      where: { id },
      include: { pets: true },
    });
  }

  async findByEmail(email: string) {
  return this.prisma.guardian.findUnique({ where: { email } });
  }

  async update(id: string, data: UpdateGuardianDto) {
    return this.prisma.guardian.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.guardian.delete({
      where: { id },
    });
  }
}