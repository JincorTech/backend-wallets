import * as request from 'web-request';
import { injectable } from 'inversify';

import config from '../config';

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
  // @TODO: To finish
  async registerUser(jwtToken: string, login: string): Promise<RegisterResult> {
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
  }

  // @TODO: To finish
  async getBalance(jwtToken: string, address: string): Promise<TransactionResult> {
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

    return result;
  }
}
