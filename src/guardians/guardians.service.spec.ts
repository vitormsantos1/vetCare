import { GuardiansRepository } from './guardians.repository';
import { GuardiansService } from './guardians.service';

describe('GuardiansService', () => {
  let service: GuardiansService;
  let repository: jest.Mocked<GuardiansRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCpf: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as never;

    service = new GuardiansService(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});