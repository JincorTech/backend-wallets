import * as request from 'web-request';
import { injectable } from 'inversify';
const QR = require('qr-image');

import config from '../config';
import { NotCorrectVerificationCode, VerificationIsNotFound } from '../exceptions/exceptions';

/* istanbul ignore next */
@injectable()
export class ContractsClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    request.defaults({
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      throwResponseError: true
    });

    this.baseUrl = baseUrl;
  }

  async sendJcrToken(): Promise<void> {
    // const result = await request.json<InitiateResult>(`/methods/${ method }/actions/initiate`, {
    //   baseUrl: this.baseUrl,
    //   auth: {
    //     bearer: this.tenantToken
    //   },
    //   method: 'POST',
    //   body: data
    // });

    // result.method = method;
    // delete result.code;
    // if (result.totpUri) {
    //   const buffer = QR.imageSync(result.totpUri, {
    //     type: 'png',
    //     size: 20
    //   });
    //   result.qrPngDataUri = 'data:image/png;base64,' + buffer.toString('base64');
    // }

    // return result;
  }
}

const ContractsClientType = Symbol('ContractsClientInterface');
export { ContractsClientType };
