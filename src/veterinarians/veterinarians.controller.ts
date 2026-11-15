import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard'; // ajuste ao caminho real
import { Roles } from 'src/auth/decorator/roles.decorator';

@ApiTags('veterinarians')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('veterinarians')
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createVeterinarianDto: CreateVeterinarianDto) {
    return this.veterinariansService.create(createVeterinarianDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.veterinariansService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.VET)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.veterinariansService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVeterinarianDto: UpdateVeterinarianDto,
  ) {
    return this.veterinariansService.update(id, updateVeterinarianDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.veterinariansService.remove(id);
  }
}
