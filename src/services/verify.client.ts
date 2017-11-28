import * as request from 'web-request';
import { injectable } from 'inversify';
const QR = require('qr-image');

import config from '../config';
import { NotCorrectVerificationCode, VerificationIsNotFound } from '../exceptions/exceptions';

export const AUTHENTICATOR_VERIFICATION = 'google_auth';
export const EMAIL_VERIFICATION = 'email';

/* istanbul ignore next */
@injectable()
export class VerificationClient implements VerificationClientInterface {
  async initiateVerification(method: string, data: InitiateData): Promise<InitiateResult> {
    const result = await request.json<InitiateResult>(`/methods/${ method }/actions/initiate`, {
      timeout: config.verify.timeout,
      baseUrl: config.verify.baseUrl,
      auth: {
        bearer: config.verify.accessJwt
      },
      method: 'POST',
      body: data
    });

    result.method = method;
    delete result.code;
    if (result.totpUri) {
      const buffer = QR.imageSync(result.totpUri, {
        type: 'png',
        size: 20
      });
      result.qrPngDataUri = 'data:image/png;base64,' + buffer.toString('base64');
    }

    return result;
  }

  async validateVerification(method: string, id: string, input: ValidateVerificationInput): Promise<ValidationResult> {
    try {
      return await request.json<ValidationResult>(`/methods/${ method }/verifiers/${ id }/actions/validate`, {
        timeout: config.verify.timeout,
        baseUrl: config.verify.baseUrl,
        auth: {
          bearer: config.verify.accessJwt
        },
        method: 'POST',
        body: input
      });
    } catch (e) {
      if (e.statusCode === 422) {
        throw new NotCorrectVerificationCode('Not correct code');
      }

      if (e.statusCode === 404) {
        throw new VerificationIsNotFound('Code was expired or not found. Please retry');
      }

      throw e;
    }
  }

  async invalidateVerification(method: string, id: string): Promise<void> {
    await request.json<Result>(`/methods/${ method }/verifiers/${ id }`, {
      timeout: config.verify.timeout,
      baseUrl: config.verify.baseUrl,
      auth: {
        bearer: config.verify.accessJwt
      },
      method: 'DELETE'
    });
  }
}

const VerificationClientType = Symbol('VerificationClientInterface');
export { VerificationClientType };
