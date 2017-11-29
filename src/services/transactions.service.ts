import { Web3Client } from './web3.client';
import { Logger } from '../logger';
import config from '../config';
import * as WebSocket from 'ws';
import { inject, injectable } from 'inversify';
import { TransactionRepository } from './repositories/transaction.repository';

@injectable()
export class PendingTransactionPorcessor {
  private logger = Logger.getInstance('PENDING_TRANSACTION_PROCESSOR');

  constructor(
    @inject('Web3Client') private web3: Web3Client,
    @inject('TransactionRepository') private transactions: TransactionRepository
  ) {
  }

  public connectContractsWs() {
    this.logger.verbose('Try to connect to contacts ws...');
    const ws = new WebSocket(`ws://${config.contracts.wsUrl}/events?tenant_token=${config.auth.accessJwt}?`);
    ws.on('open', () => {
      this.logger.verbose('Connected, wait events');
      ws.on('message', (data) => {
        try {
          const event: any = JSON.parse(data.toString());
          if (event.type === 'transaction') {
            this.transactions.updateStatusByIds(event.payload.status === 'VALID' ? 'success' : 'failure', [event.payload.transaction])
              .then((data) => data, (err) => err);
          }
        } catch (error) {
          this.logger.error('Error occurred when process incoming message', error);
        }
      });
    });
    ws.on('close', (code) => {
      this.logger.verbose('Disconnected');
      if (code !== 1000) {
        this.logger.warn('Not normal disconnection, try to reconnect to WS...');
        setTimeout(() => this.connectContractsWs(), 1000);
      }
    });
  }

  public async runEthereumTransactionStatuses() {
    try {
      const transactions = await this.transactions.getAllByStatusAndCurrency('pending', 'ETH');
      if (transactions.length) {
        this.logger.verbose('Transactions in pending...', transactions.length);
        const transStatuses = await this.web3.getTransactionGrouppedStatuses(transactions.map(t => t.id));
        this.logger.verbose('Transactions statuses success/failure', transStatuses.success, transStatuses.failure);
        if (transStatuses.failure.length || transStatuses.success.length) {
          this.logger.verbose('Update pending transactions...');
          await Promise.all([
            this.transactions.updateStatusByIds('success', transStatuses.success),
            this.transactions.updateStatusByIds('failure', transStatuses.failure)
          ]);
        }
      }
    } catch (error) {
      this.logger.error('Error occurred, when process ehtereum transaction statuses', error);
    }
    setTimeout(() => this.runEthereumTransactionStatuses(), 10000);
  }
}
