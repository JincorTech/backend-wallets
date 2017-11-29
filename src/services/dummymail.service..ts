import * as Mailgun from 'mailgun-js';
import * as MailComposer from 'mailcomposer';
import { injectable } from 'inversify';
import 'reflect-metadata';
import config from '../config';
import { Logger } from '../logger';

@injectable()
export class DummyMailService implements EmailServiceInterface {
  private logger: Logger = Logger.getInstance('DUMMYMAIL_SERVICE');

  /**
   * @inheritdoc
   */
  public send(sender: string, recipient: string, subject: string, text: string): Promise<any> {
    this.logger.verbose('Send email', sender, recipient, subject, text);

    return Promise.resolve(text);
  }
}
