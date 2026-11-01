import { UnauthorizedException } from '@nestjs/common';
import { Role, Status, User } from '@prisma/client';
import { createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unnecessary-type-assertion */

jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

describe('AuthService password recovery', () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthRepository>;
  let mail: jest.Mocked<MailService>;
  const activeUser: User = {
    id: 'user-id',
    name: 'User',
    email: 'user@vetcare.com',
    password: 'old-hash',
    status: Status.ACTIVE,
    role: Role.RECEPTIONIST,
    createdAt: new Date(),
    updatedAt: new Date(),
    passwordResetTokenHash: null,
    passwordResetTokenExpiresAt: null,
  };

  beforeEach(() => {
    repository = {
      findByEmail: jest.fn(),
      findByPasswordResetTokenHash: jest.fn(),
      savePasswordResetToken: jest.fn(),
      clearPasswordResetToken: jest.fn(),
      resetPasswordWithToken: jest.fn(),
    } as never;
    mail = { sendPasswordRecoveryEmail: jest.fn() } as never;
    service = new AuthService(repository, { sign: jest.fn() } as never, mail);
    process.env.FRONTEND_URL = 'https://vetcare.test';
    jest.clearAllMocks();
  });

  it('stores only the token hash with a 15-minute expiration and sends the raw token link', async () => {
    repository.findByEmail.mockResolvedValue(activeUser);
    const before = Date.now();
    await service.forgotPassword(activeUser.email);
    const [id, tokenHash, expiresAt] =
      repository.savePasswordResetToken.mock.calls[0];
    expect(id).toBe(activeUser.id);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 15 * 60 * 1000,
    );
    const link = mail.sendPasswordRecoveryEmail.mock.calls[0][1];
    const token = new URL(link).searchParams.get('token')!;
    expect(createHash('sha256').update(token).digest('hex')).toBe(tokenHash);
  });

  it.each([null, { ...activeUser, status: Status.INACTIVE }])(
    'returns the same generic response for unknown and inactive emails',
    async (user) => {
      repository.findByEmail.mockResolvedValue(user as never);
      await expect(
        service.forgotPassword('unknown@vetcare.com'),
      ).resolves.toHaveProperty('message');
      expect(repository.savePasswordResetToken).not.toHaveBeenCalled();
      expect(mail.sendPasswordRecoveryEmail).not.toHaveBeenCalled();
    },
  );

  it('clears the token after an email delivery error', async () => {
    repository.findByEmail.mockResolvedValue(activeUser);
    mail.sendPasswordRecoveryEmail.mockRejectedValue(
      new Error('Mailjet error'),
    );
    await service.forgotPassword(activeUser.email);
    expect(repository.clearPasswordResetToken).toHaveBeenCalledWith(
      activeUser.id,
    );
  });

  it('hashes the new password and consumes the token atomically', async () => {
    repository.findByPasswordResetTokenHash.mockResolvedValue(activeUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-password-hash');
    repository.resetPasswordWithToken.mockResolvedValue({ count: 1 } as never);
    await expect(
      service.resetPassword('raw-token', 'new-password'),
    ).resolves.toHaveProperty('message');
    expect(repository.resetPasswordWithToken).toHaveBeenCalledWith(
      createHash('sha256').update('raw-token').digest('hex'),
      'new-password-hash',
      expect.any(Date),
    );
  });

  it.each([null, { ...activeUser, status: Status.INACTIVE }])(
    'rejects unavailable or inactive reset tokens',
    async (user) => {
      repository.findByPasswordResetTokenHash.mockResolvedValue(user as never);
      await expect(
        service.resetPassword('bad-token', 'new-password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it('rejects a token already consumed by another reset request', async () => {
    repository.findByPasswordResetTokenHash.mockResolvedValue(activeUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-password-hash');
    repository.resetPasswordWithToken.mockResolvedValue({ count: 0 } as never);
    await expect(
      service.resetPassword('reused-token', 'new-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
