import { Web3Client } from './web3.client';
import { Logger } from '../logger';
import config from '../config';
import * as WebSocket from 'ws';
import { inject, injectable } from 'inversify';
import { TransactionRepository } from './repositories/transaction.repository';
import successEmailTransaction from '../emails/success';

@injectable()
export class PendingTransactionProcessor {
  private logger = Logger.getInstance('PENDING_TRANSACTION_PROCESSOR');

  constructor(
    @inject('Web3Client') private web3: Web3Client,
    @inject('TransactionRepository') private transactions: TransactionRepository,
    @inject('EmailService') private emailService: EmailServiceInterface
  ) {
  }

  public connectContractsWs() {
    this.logger.verbose('Try to connect to contacts WS...', config.contracts.wsUrl);
    let isAlive = false;
    const ws = new WebSocket(`${config.contracts.wsUrl}/events?tenant_token=${config.auth.accessJwt}`);
    ws.on('open', async() => {
      this.logger.verbose('Connected, watch transactions...');

      const getTransactionStatus = (txId: string) => {
        ws.send(JSON.stringify({
          command: 'TRANSACTION_STATUS',
          args: {
            network: config.contracts.network,
            peers: config.contracts.peers,
            initiateUser: config.contracts.maintainUser,
            txId
          }
        }));
      };

      const requestPendingTransactions = async() => {
        const transactions = await this.transactions.getAllByStatusAndCurrency('pending', 'JCR');

        if (transactions.length) {
          this.logger.verbose('JCR Transactions in pending...', transactions.length);
          transactions.filter(t => t.id && t.id.indexOf('0x') === 0).forEach(t => getTransactionStatus(t.id));
        }

        if (isAlive) {
          setTimeout(() => requestPendingTransactions(), 5000);
        }
      };
      requestPendingTransactions();

      ws.on('message', (socketData) => {
        try {
          const data: any = JSON.parse(socketData.toString());
          if (data.response && data.response.status !== 'pending') {
            const transHash = data.response.txId;
            this.transactions.updateStatusByIds(data.response.status, [transHash])
              .then((data) => data, (err) => err);
            if (data.response.status === 'success') {
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

      isAlive = true;
    });
    ws.on('error', (err) => {
      this.logger.error('WS Error occured, try to reconnect, ', err);
      ws.close(1008);
      isAlive = false;
      setTimeout(() => this.connectContractsWs(), 3000);
    });
    ws.on('close', (code, reason) => {
      this.logger.verbose('WS Disconnected');
      isAlive = false;
      if (code !== 1000) {
        this.logger.warn('Not normal disconnection, try to reconnect to WS...', code, reason);
        setTimeout(() => this.connectContractsWs(), 3000);
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
        const transStatuses = await this.web3.getTransactionGroupedStatuses(transactions.map(t => t.id));
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
