import { injectable } from 'inversify';
import 'reflect-metadata';
import config from '../config';
import { Logger } from '../logger';

@injectable()
export class MailjetService implements EmailServiceInterface {
  private logger: Logger = Logger.getInstance('MAILJET_SERVICE');
  private api: any;

  /**
   * Initiate concrete provider instance
   */
  constructor() {
    this.api = require('node-mailjet').connect(config.email.mailjet.apiKey, config.email.mailjet.apiSecret);
  }

  /**
   * @inheritdoc
   */
  public send(sender: string, recipient: string, subject: string, text: string): Promise<any> {
    this.logger.verbose('Send email', sender, recipient, subject);

    const sendEmail = this.api.post('send');

    const emailData = {
      'FromEmail': sender,
      'Subject': subject,
      'Html-part': text,
      'Recipients': [ { 'Email': recipient } ]
    };

    return sendEmail.request(emailData);
  }
}
