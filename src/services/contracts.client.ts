import * as request from 'web-request';
import { injectable } from 'inversify';

import config from '../config';
import { Logger } from '../logger';

export interface RegisterResult {
  username: string;
  address: string;
}

export interface TransactionResult {
  transaction: string;
  result: any;
}

/* istanbul ignore next */
@injectable()
export class ContractsClient {
  private logger: Logger = Logger.getInstance('CONTRACTS_CLIENT');

  // @TODO: To finish
  async registerUser(jwtToken: string, login: string, password: string): Promise<RegisterResult> {
    this.logger.verbose('Register user', login);

    const result = await request.json<RegisterResult>(`/api/accounts`, {
      baseUrl: config.contracts.baseUrl,
      auth: {
        bearer: jwtToken
      },
      method: 'post',
      body: {
        loginFromJwt: 'true',
        password: login // It's dirty
      }
    });

    return result;
  }

  // @TODO: To finish
  async transferJcrToken(jwtToken: string, toAddress: string, amount: string): Promise<TransactionResult> {
    this.logger.verbose('Transfer jcr token', toAddress, amount);

    try {
      const result = await request.json<TransactionResult>(`/api/networks/${config.contracts.network}/contracts/${config.contracts.jincorToken.address}/actions/invoke`, {
        baseUrl: config.contracts.baseUrl,
        auth: {
          bearer: jwtToken
        },
        method: 'post',
        body: {
          peers: config.contracts.peers,
          abi: config.contracts.jincorToken.abi,
          method: 'transfer',
          args: [toAddress, amount],
          commitTransaction: true
        }
      });

      return result;
    } catch (error) {
      this.logger.error('transferJcrToken failed with', error);
      throw error;
    }
  }

  // @TODO: To finish
  async getBalance(jwtToken: string, address: string): Promise<string> {
    this.logger.verbose('Get balance', address);

    try {
      const result = await request.json<TransactionResult>(`/api/networks/${config.contracts.network}/contracts/${config.contracts.jincorToken.address}/actions/invoke`, {
        baseUrl: config.contracts.baseUrl,
        auth: {
          bearer: jwtToken
        },
        method: 'post',
        body: {
          peers: config.contracts.peers,
          abi: config.contracts.jincorToken.abi,
          method: 'getBalance',
          args: [address],
          commitTransaction: false
        }
      });

      return '' + (result.result[0] || 0);
    } catch (error) {
      this.logger.error('getBalance failed with', error);
      throw error;
    }
  }
}
