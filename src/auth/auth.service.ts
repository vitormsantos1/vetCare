import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async validarAcesso(credenciais: LoginDto) {
    const usuario = await this.authRepository.findByEmail(credenciais.email);

    if (!usuario) {
      throw new UnauthorizedException('e-mail e/ou senha incorretos.');
    }

    const senhaValida = await bcrypt.compare(
      credenciais.password,
      usuario.password,
    );

    if (!senhaValida) {
      throw new UnauthorizedException('E-mail e/ou senha incorretos.');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async forgotPassword(email: string) {
    const user = await this.authRepository.findByEmail(email);

    if (!user || user.status !== 'ACTIVE') {
      return this.forgotPasswordResponse();
    }

    const code = randomInt(100000, 1000000).toString();
    const codeHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.authRepository.savePasswordResetToken(
      user.id,
      codeHash,
      expiresAt,
    );

    try {
      await this.mailService.sendPasswordRecoveryEmail(user.email, code);
    } catch {
      await this.authRepository.clearPasswordResetToken(user.id);
      this.logger.error('Falha ao enviar e-mail de recuperação de senha.');
    }

    return this.forgotPasswordResponse();
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.authRepository.findByPasswordResetTokenHash(
      tokenHash,
      new Date(),
    );
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await this.authRepository.resetPasswordWithToken(
      tokenHash,
      passwordHash,
      new Date(),
    );
    if (result.count !== 1) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
    return { message: 'Senha redefinida com sucesso.' };
  }

  private forgotPasswordResponse() {
    return {
      message:
        'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
    };
  }
}
