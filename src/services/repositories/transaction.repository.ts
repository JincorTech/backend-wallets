import { Transaction } from '../../entities/transaction';
import { injectable, inject } from 'inversify';
import { Logger } from '../../logger';
import { MongoDbConnector } from './mongodb.connector.service';

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  getByVerificationId(verificationId: string): Promise<Transaction>;
  getAllByWalletAddresses(walletAddresses: Array<string>): Promise<Array<Transaction>>;
  getAllByStatusAndCurrency(status: string, currency: string): Promise<Array<Transaction>>;
  updateStatusByIds(status: string, ids: string[]): Promise<void>;
}

@injectable()
export class MongoTransactionRepository implements TransactionRepository {
  private logger = Logger.getInstance('MONGO_TRANSACTION_REPOSITORY');
  constructor(
    @inject('MongoDbConnector') private mongoConnector: MongoDbConnector
  ) {
  }

  /**
   * @param transaction
   */
  async save(transaction: Transaction): Promise<void> {
    this.logger.debug('Save', transaction);
    await (await this.mongoConnector.getDb()).collection('transactions').save(transaction);
  }

  async getByVerificationId(verificationId: string): Promise<Transaction> {
    this.logger.debug('Query by verification', verificationId);
    const transaction: Transaction = await (await this.mongoConnector.getDb()).collection('transactions').findOne({
      verificationId
    });
    return transaction;
  }

  /**
   * @param walletAddresses
   */
  async getAllByWalletAddresses(walletAddresses: Array<string>): Promise<Array<Transaction>> {
    this.logger.debug('Query all by', walletAddresses);
    const transactions: Array<Transaction> = await (await this.mongoConnector.getDb()).collection('transactions').find({
      'walletAddress': {
        '$in': walletAddresses
      }
    }).toArray();

    return transactions;
  }

  async getAllByStatusAndCurrency(status: string, currency: string): Promise<Array<Transaction>> {
    this.logger.debug('Query all by statuse and currency', status, currency);
    return (await (await this.mongoConnector.getDb()).collection('transactions').find({
      status,
      currency
    })).toArray();
  }

  async updateStatusByIds(status: string, ids: string[]): Promise<void> {
    this.logger.debug('Update statuses by ids', status, ids);
    const result = await (await this.mongoConnector.getDb()).collection('transactions').updateMany({
      _id: {
        $in: ids
      }
    }, {
      $set: { status }
    });
  }
}
