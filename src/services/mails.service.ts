import Mailjet from 'node-mailjet';
import { Service } from 'typedi';
import { HttpException } from '../exceptions/httpException';
import { verifyEmailTemplate } from '../utils/templates';
import { EMAIL, MAILJET_API_KEY, MAILJET_API_SECRET_KEY } from '../config';

interface MailjetResponse {
  Messages: {
    Status: string;
    To: {
      Email: string;
      MessageUUID: string;
      MessageID: number;
    }[];
  }[];
}

@Service()
export class MailService {
  public mailjet = new Mailjet({
    apiKey: MAILJET_API_KEY,
    apiSecret: MAILJET_API_SECRET_KEY,
  });

  public async sendEmailVerification(email: string, link: string): Promise<string> {
    const subject = 'Invitation à rejoindre le groupe de contrôle';

    const content = `
    <p>Bonjour !</p>
    <p> Vous avez été invité à rejoindre  Meena </p>
    <p>Pour cela, cliquez sur le lien ci-dessous : </p>
  `;

    const disclaimer = `
  <p>Si vous n'ètes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
    `;

    const request = await this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: EMAIL,
            Name: 'Meena Corp',
          },
          To: [
            {
              Email: email,
            },
          ],
          Subject: subject,
          HTMLPart: await verifyEmailTemplate(content, subject, link, disclaimer),
        },
      ],
    });

    const response = request.body as unknown as MailjetResponse;

    if (response.Messages[0].Status.trim().toLowerCase() !== 'success') {
      throw new HttpException(409, "Erreur lors de l'envoi de l'email d'invitation");
    }
    return response.Messages[0].Status.trim().toLowerCase();
  }
}
