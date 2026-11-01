import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from 'src/users/users.repository';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {}

  findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  findByPasswordResetTokenHash(tokenHash: string, now: Date) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: { gt: now },
      },
    });
  }

  savePasswordResetToken(id: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
      },
    });
  }

  clearPasswordResetToken(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    });
  }

  resetPasswordWithToken(tokenHash: string, password: string, now: Date) {
    return this.prisma.user.updateMany({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: { gt: now },
        status: 'ACTIVE',
      },
      data: {
        password,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    });
  }
}
