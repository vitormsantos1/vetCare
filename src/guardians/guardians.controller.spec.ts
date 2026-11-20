import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class JwtAuthGuard {},
}));

describe('GuardiansController', () => {
  let controller: GuardiansController;
  let service: jest.Mocked<GuardiansService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    controller = new GuardiansController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});