import { Injectable } from '@nestjs/common';
import Mailjet from 'node-mailjet';

@Injectable()
export class MailService {
  async sendPasswordRecoveryEmail(to: string, code: string): Promise<void> {
    const mailjet = new Mailjet({
      apiKey: process.env.MJ_APIKEY_PUBLIC!,
      apiSecret: process.env.MJ_APIKEY_PRIVATE!,
    });

    const response = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAIL_FROM_EMAIL!,
            Name: process.env.MAIL_FROM_NAME || 'VetCare',
          },
          To: [{ Email: to }],
          Subject: 'Recuperação de senha - VetCare',
          TextPart: `Seu código de recuperação é ${code}. Ele expira em 15 minutos.`,
          HTMLPart: `
            <h2>Recuperação de senha - VetCare</h2>
            <p>Seu código de recuperação é:</p>
            <h1>${code}</h1>
            <p>Ele expira em 15 minutos.</p>
            <p>Se você não solicitou essa recuperação, ignore este e-mail.</p>
          `,
        },
      ],
    });

    console.log('Resposta do Mailjet:', response.body);
  }
}
