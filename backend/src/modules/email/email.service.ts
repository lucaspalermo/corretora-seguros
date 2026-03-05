import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private enabled: boolean;

  constructor(private config: ConfigService) {
    const host = this.config.get('SMTP_HOST');
    this.enabled = !!host;

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get('SMTP_PORT', 587),
        secure: this.config.get('SMTP_SECURE', 'false') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
      this.logger.log('Email service configurado');
    } else {
      this.logger.warn('Email service desabilitado (SMTP_HOST nao configurado). Emails serao logados no console.');
    }
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) {
    const from = options.from || this.config.get('SMTP_FROM', 'noreply@segurasaas.com');

    if (!this.enabled) {
      this.logger.log(`[EMAIL SIMULADO] Para: ${options.to} | Assunto: ${options.subject}`);
      this.logger.debug(options.html);
      return { messageId: 'simulated', accepted: [options.to] };
    }

    try {
      const result = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email enviado para ${options.to}: ${result.messageId}`);
      return result;
    } catch (err) {
      this.logger.error(`Erro ao enviar email para ${options.to}: ${err}`);
      throw err;
    }
  }

  // Template: Parcela vencida
  async sendOverdueNotice(to: string, data: {
    clientName: string;
    policyNumber: string;
    installmentNumber: number;
    amount: string;
    dueDate: string;
    brokerName: string;
    brokerPhone?: string;
  }) {
    return this.send({
      to,
      subject: `Parcela em atraso - Apolice ${data.policyNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Aviso de Parcela em Atraso</h2>
          <p>Ola, <strong>${data.clientName}</strong>,</p>
          <p>Identificamos que a parcela abaixo esta em atraso:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Apolice</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.policyNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Parcela</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.installmentNumber}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Valor</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Vencimento</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.dueDate}</td>
            </tr>
          </table>
          <p>Por favor, entre em contato conosco para regularizar.</p>
          <p>Atenciosamente,<br/><strong>${data.brokerName}</strong>${data.brokerPhone ? `<br/>Tel: ${data.brokerPhone}` : ''}</p>
        </div>
      `,
    });
  }

  // Template: Lembrete de vencimento
  async sendDueReminder(to: string, data: {
    clientName: string;
    policyNumber: string;
    installmentNumber: number;
    amount: string;
    dueDate: string;
    brokerName: string;
  }) {
    return this.send({
      to,
      subject: `Lembrete de Vencimento - Apolice ${data.policyNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Lembrete de Vencimento</h2>
          <p>Ola, <strong>${data.clientName}</strong>,</p>
          <p>Lembramos que a parcela abaixo vence em breve:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Apolice</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.policyNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Parcela</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.installmentNumber}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Valor</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Vencimento</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.dueDate}</td>
            </tr>
          </table>
          <p>Atenciosamente,<br/><strong>${data.brokerName}</strong></p>
        </div>
      `,
    });
  }

  // Template: Renovacao de apolice
  async sendRenewalNotice(to: string, data: {
    clientName: string;
    policyNumber: string;
    endDate: string;
    category: string;
    insurerName: string;
    brokerName: string;
    brokerPhone?: string;
  }) {
    return this.send({
      to,
      subject: `Renovacao de Apolice - ${data.policyNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Renovacao de Apolice</h2>
          <p>Ola, <strong>${data.clientName}</strong>,</p>
          <p>Sua apolice esta proxima do vencimento:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Apolice</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.policyNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Operadora</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.insurerName}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Vencimento</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.endDate}</td>
            </tr>
          </table>
          <p>Entre em contato para renovar ou atualizar seu seguro.</p>
          <p>Atenciosamente,<br/><strong>${data.brokerName}</strong>${data.brokerPhone ? `<br/>Tel: ${data.brokerPhone}` : ''}</p>
        </div>
      `,
    });
  }

  // Template: Link portal do cliente
  async sendPortalLink(to: string, data: {
    clientName: string;
    portalUrl: string;
    brokerName: string;
  }) {
    return this.send({
      to,
      subject: `Acesse seu Portal de Seguros - ${data.brokerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Portal do Cliente</h2>
          <p>Ola, <strong>${data.clientName}</strong>,</p>
          <p>Voce pode acessar suas apolices e parcelas pelo link abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.portalUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Meu Portal
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este link e valido por 30 dias.</p>
          <p>Atenciosamente,<br/><strong>${data.brokerName}</strong></p>
        </div>
      `,
    });
  }
}
