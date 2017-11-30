import { Web3Client } from './web3.client';
import { Logger } from '../logger';
import config from '../config';
import * as WebSocket from 'ws';
import { inject, injectable } from 'inversify';
import { TransactionRepository } from './repositories/transaction.repository';
import successEmailTransaction from '../emails/success';

@injectable()
export class PendingTransactionPorcessor {
  private logger = Logger.getInstance('PENDING_TRANSACTION_PROCESSOR');

  constructor(
    @inject('Web3Client') private web3: Web3Client,
    @inject('TransactionRepository') private transactions: TransactionRepository,
    @inject('EmailService') private emailService: EmailServiceInterface
  ) {
  }

  public connectContractsWs() {
    this.logger.verbose('Try to connect to contacts WS...', config.contracts.wsUrl);
    const ws = new WebSocket(`${config.contracts.wsUrl}/events?tenant_token=${config.auth.accessJwt}`);
    ws.on('open', () => {
      this.logger.verbose('Connected, wait events');
      ws.on('message', (data) => {
        try {
          const event: any = JSON.parse(data.toString());
          if (event.type === 'transaction') {
            const transHash = '0x' + event.payload.txId;
            this.transactions.updateStatusByIds(event.payload.status === 'VALID' ? 'success' : 'failure', [transHash])
              .then((data) => data, (err) => err);
            if (event.payload.status === 'VALID') {
              this.transactions.getByTransactionHash(transHash).then((tx) => {
                const email = tx.login.split(':').pop();
                this.emailService.send(config.email.from.general, email, 'Success transaction', successEmailTransaction(tx.currency, tx.amount, tx.id));
              });
            }
          }
        } catch (error) {
          this.logger.error('Error occurred when process incoming message', error);
        }
      });
    });
    ws.on('error', (err) => {
      this.logger.error('WS Error occured, ', err);
      ws.close(1008);
    });
    ws.on('close', (code, reason) => {
      this.logger.verbose('WS Disconnected');
      if (code !== 1000) {
        this.logger.warn('Not normal disconnection, try to reconnect to WS...', code, reason);
        if (code !== 1008) {
          setTimeout(() => this.connectContractsWs(), 1000);
        }
      }
    });
  }

  public async connectEthereumBus() {
    this.logger.verbose('Run waiting ethereum transactions...');
    this.runEthereumTransactionStatuses();
  }

  private async runEthereumTransactionStatuses() {
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
          await Promise.all(
            transactions.filter(tx => transStatuses.success.indexOf(tx.id) > -1).map(tx => {
              const email = tx.login.split(':').pop();
              return this.emailService.send(config.email.from.general, email, 'Success transaction', successEmailTransaction(tx.currency, tx.amount, tx.id));
            })
          );
        }
      }
    } catch (error) {
      this.logger.error('Error occurred, when process ehtereum transaction statuses', error);
    }
    setTimeout(() => this.runEthereumTransactionStatuses(), 10000);
  }
}
