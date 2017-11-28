import { injectable, inject } from 'inversify';

import { Logger } from '../../logger';
import { MongoDbConnector } from './mongodb.connector.service';
import { TransactionRepository } from './transaction.repository';
import { Wallet } from '../../entities/wallet';
import { Transaction } from '../../entities/transaction';

export interface WalletRepository {
  save(wallet: Wallet, saveRelated: boolean): Promise<void>;
  getAllByUserIdAndCompanyId(userId: string, companyId: string): Promise<Array<Wallet>>;
}

@injectable()
export class MongoWalletRepository implements WalletRepository {
  private logger = Logger.getInstance('MONGO_WALLET_REPOSITORY');
  constructor(
    @inject('TransactionRepository') private transactionRepository: TransactionRepository,
    @inject('MongoDbConnector') private mongoConnector: MongoDbConnector
  ) {
  }

  /**
   * @param wallet
   */
  async save(wallet: Wallet, saveRelated: boolean = false): Promise<void> {
    if (saveRelated) {
      await Promise.all(wallet.transactions.map(t => this.transactionRepository.save(t, false)));
    }
    const related = wallet.transactions = [];
    this.logger.debug('Save', wallet);
    await (await this.mongoConnector.getDb()).collection('wallets').save(wallet);
    wallet.transactions = related;
  }

  /**
   * @param userId
   * @param companyId
   */
  async getAllByUserIdAndCompanyId(userId: string, companyId: string): Promise<Array<Wallet>> {
    const wallets: Array<Wallet> = await (await this.mongoConnector.getDb()).collection('wallets').find({
      ownerId: userId,
      companyId: companyId
    }).toArray();

    // join with trans
    if (wallets.length) {
      let walletsAddressToIndex = {};
      wallets.forEach((w, i) => walletsAddressToIndex[w.address] = i);

      const transactions: Array<Transaction> = await this.transactionRepository.getAllByWalletAddresses(wallets.map(w => w.address));
      transactions.forEach(t => wallets[walletsAddressToIndex[t.employee.wallet]].transactions.push(t));
    }

    return wallets;
  }
}
