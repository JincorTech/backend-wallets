import * as request from 'web-request';
import { injectable } from 'inversify';

import config from '../config';
import { Logger } from '../logger';
import * as lodash from 'lodash';
import { TransactionsGrouppedByStatuses } from './web3.client';

export interface RegisterResult {
  username: string;
  address: string;
}

export interface TransactionResult {
  result: {
    transaction: string;
    result: any;
  };
}

/* istanbul ignore next */
@injectable()
export class ContractsClient {
  private logger: Logger = Logger.getInstance('CONTRACTS_CLIENT');

  // @TODO: To finish
  async registerUser(jwtToken: string, login: string, password: string, isCorporate: boolean): Promise<RegisterResult> {
    this.logger.verbose('Register user', login);

    const result = await request.json<RegisterResult>(`/api/accounts`, {
      baseUrl: config.contracts.baseUrl,
      auth: {
        bearer: jwtToken
      },
      method: 'post',
      body: {
        loginFromJwt: 'true',
        password: password,
        isCorporate
      }
    });

    return result;
  }

  // @TODO: To finish
  async getTransactionStatus(jwtToken: string, transactionHash: string): Promise<string> {
    this.logger.verbose('getTransactionStatus', transactionHash);

    try {
      const result = await request.json<any>(`/channels/${config.contracts.network}/transactions/actions/query`, {
        baseUrl: config.contracts.baseUrl,
        auth: {
          bearer: jwtToken
        },
        method: 'post',
        body: {
          transaction: transactionHash,
          peers: config.contracts.peers
        }
      });

      return lodash.get(result, 'data.transactionEnvelope.payload.data.actions[0].payload.action.proposal_response_payload.extension.response') === 200 ?
        'success' :
        'failure';
    } catch (error) {
      if (error.message && error.message.indexOf('chaincode error (status: 500, message: Failed to get transaction with id ') === 0) {
        return 'pending';
      }
      this.logger.error('Error occurred when get transaction', error);
      throw error;
    }
  }

  async getTransactionGrouppedStatuses(jwtToken: string, transactionIds: string[]): Promise<TransactionsGrouppedByStatuses> {
    const parts = lodash.chunk(transactionIds, 5);
    let data = [];

    for (let i = 0; i < parts.length; i++) {
      data = data.concat(
        await Promise.all(parts[i].map(txId => this.getTransactionStatus(jwtToken, txId)))
      ).filter(t => t).map(t => ({
        status: t.status,
        txId: t.transactionHash
      }));
    }

    return {
      success: data.filter(t => t.status === '0x1').map(t => t.txId),
      failure: data.filter(t => t.status !== '0x1').map(t => t.txId)
    };
  }

  // @TODO: To finish
  async transferJcrToken(jwtToken: string, isCorporate: boolean, toAddress: string, amount: string): Promise<TransactionResult> {
    this.logger.verbose('Transfer jcr token', toAddress, amount);

    try {
      const result = await request.json<TransactionResult>(`/api/networks/${config.contracts.network}/contracts/${config.contracts.jincorToken.address}/actions/invoke`, {
        baseUrl: config.contracts.baseUrl,
        auth: {
          bearer: jwtToken
        },
        method: 'post',
        body: {
          isCorporate,
          peers: config.contracts.peers,
          abi: config.contracts.jincorToken.abi,
          method: 'transfer',
          args: [toAddress, '' + amount],
          commitTransaction: true
        }
      });

      return result;
    } catch (error) {
      this.logger.error('transferJcrToken failed with', error);
      throw new Error('Can\'t transfer tokens');
    }
  }

  // @TODO: To finish
  async getBalance(jwtToken: string, isCorporate: boolean, address: string): Promise<string> {
    this.logger.verbose('Get balance', address);

    try {
      const result = await request.json<TransactionResult>(`/api/networks/${config.contracts.network}/contracts/${config.contracts.jincorToken.address}/actions/invoke`, {
        baseUrl: config.contracts.baseUrl,
        auth: {
          bearer: jwtToken
        },
        method: 'post',
        body: {
          isCorporate,
          peers: config.contracts.peers,
          abi: config.contracts.jincorToken.abi,
          method: 'balanceOf',
          args: [address],
          commitTransaction: false
        }
      });

      return '' + parseInt(result.result.result[0] || '00',16);
    } catch (error) {
      this.logger.error('getBalance failed with', error);
      throw error;
    }
  }
}
