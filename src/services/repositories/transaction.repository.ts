import { Transaction } from '../../entities/transaction';
import { injectable, inject } from 'inversify';
import { Logger } from '../../logger';
import { MongoDbConnector } from './mongodb.connector.service';

export interface TransactionRepository {
  save(transaction: Transaction, saveRelated: boolean): Promise<void>;
  getByVerificationId(verificationId: string): Promise<Transaction>;
  getAllByWalletAddresses(walletAddresses: Array<string>): Promise<Array<Transaction>>;
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
  async save(transaction: Transaction, saveRelated: boolean = false): Promise<void> {
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
      'employee.wallet': {
        '$in': walletAddresses
      }
    }).toArray();

    return transactions;
  }
}
