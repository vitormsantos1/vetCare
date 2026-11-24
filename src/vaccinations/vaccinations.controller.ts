import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { VaccinationsService } from './vaccinations.service';

@ApiTags('Vaccinations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vaccinations')
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({
    summary: 'Registra a aplicação de uma vacina no animal (REQ 12)',
  })
  create(@Body() createVaccinationDto: CreateVaccinationDto) {
    return this.vaccinationsService.create(createVaccinationDto);
  }

  @Get('pet/:petId')
  @Roles(Role.ADMIN, Role.VET, Role.RECEPTIONIST)
  @ApiOperation({
    summary: 'Consulta o histórico/cartão de vacinas de um animal (REQ 12)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findByPet(
    @Param('petId', ParseUUIDPipe) petId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.vaccinationsService.findByPet(petId, page, limit);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.VET, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Busca um registro de vacinação pelo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vaccinationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({
    summary: 'Atualiza dados da vacinação ou previsão da próxima dose',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVaccinationDto: UpdateVaccinationDto,
  ) {
    return this.vaccinationsService.update(id, updateVaccinationDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.VET)
  @ApiOperation({ summary: 'Remove um registro de vacinação' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vaccinationsService.remove(id);
  }
}