import { PickType } from '@nestjs/swagger';
import { CreateVeterinarianDto } from './create-veterinarian.dto';

export class UpdateVeterinarianDto extends PickType(CreateVeterinarianDto, [
  'crmv',
  'phone',
  'specialty',
]) {}
