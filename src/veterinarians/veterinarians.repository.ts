import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';

@Injectable()
export class VeterinariansRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVeterinarianDto) {
    return this.prisma.veterinarian.create({ data });
  }

  async findAll() {
    return this.prisma.veterinarian.findMany();
  }

  async findOne(id: string) {
    return this.prisma.veterinarian.findUnique({ where: { id } });
  }

  async findByCrmv(crmv: string) {
    return this.prisma.veterinarian.findUnique({ where: { crmv } });
  }

  async findByCrmvOrUserId(crmv: string, userId: string) {
    return this.prisma.veterinarian.findFirst({
      where: { 
        OR: [
          { crmv: crmv }, 
          { userId: userId }
        ] 
      },
    });
  }

  async update(id: string, data: UpdateVeterinarianDto) {
    return this.prisma.veterinarian.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.veterinarian.delete({ where: { id } });
  }
}